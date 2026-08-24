"""
Issue Detector — generates structured issues from real telemetry and ML predictions.

Rules are threshold-based and consider the sustained duration of a condition
by examining the window of recent telemetry passed in.

Each issue includes: type, severity, observed_value, threshold, duration_seconds,
explanation, recommendation.

Importantly:
- Issues are only raised when the relevant metric is available (not None).
- Severity levels: INFO, WARNING, HIGH, CRITICAL
- We do NOT claim hardware failure unless supported by evidence.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# ── Configurable thresholds ───────────────────────────────────────────────────
THRESHOLDS = {
    "cpu_high": {"warning": 80.0, "high": 90.0, "critical": 95.0},
    "memory_pressure": {"warning": 80.0, "high": 87.0, "critical": 93.0},
    "disk_capacity": {"warning": 85.0, "high": 92.0, "critical": 97.0},
    "battery_low": {"warning": 20.0, "high": 10.0, "critical": 5.0},
}


@dataclass
class DetectedIssue:
    issue_type: str
    condition_band: str           # e.g., HIGH, WARNING, CRITICAL
    severity: str                 # INFO | WARNING | HIGH | CRITICAL
    device_id: str
    detected_at: datetime
    metric: str
    observed_value: float
    threshold: float
    duration_seconds: int         # approx duration condition was sustained
    explanation: str
    recommendation: str
    status: str = "DETECTED"         # DETECTED | RESOLVED


def detect_issues(
    device_id: str,
    latest_telemetry,            # TelemetrySample ORM object
    prediction=None,             # Prediction ORM object (may be None)
    recent_telemetry_window: Optional[List] = None,  # list of TelemetrySample
) -> List[DetectedIssue]:
    """
    Evaluate current telemetry (and optionally a window of recent history)
    to produce a list of DetectedIssue objects.

    Args:
        device_id: agent device_id
        latest_telemetry: most recent TelemetrySample ORM row
        prediction: most recent Prediction ORM row (may be None)
        recent_telemetry_window: list of recent TelemetrySample rows for duration calc
    """
    issues: List[DetectedIssue] = []
    now = datetime.now(timezone.utc)

    t = latest_telemetry
    window = recent_telemetry_window or [t]

    def _duration(metric_attr: str, above: float) -> int:
        """
        Count seconds the metric has been continuously above threshold
        by examining the telemetry window (oldest first).
        Returns 0 if insufficient data.
        """
        sustained = [
            r for r in window
            if getattr(r, metric_attr, None) is not None
            and getattr(r, metric_attr) >= above
        ]
        if len(sustained) < 2:
            return len(sustained) * 10  # ~10s per sample estimate
        oldest = sustained[0].timestamp_utc
        newest = sustained[-1].timestamp_utc
        if oldest.tzinfo is None:
            oldest = oldest.replace(tzinfo=timezone.utc)
        if newest.tzinfo is None:
            newest = newest.replace(tzinfo=timezone.utc)
        return int((newest - oldest).total_seconds())

    def _make(
        issue_type: str, severity: str, metric: str, value: float,
        threshold: float, duration_s: int, explanation: str, recommendation: str
    ) -> DetectedIssue:
        return DetectedIssue(
            issue_type=issue_type,
            condition_band=severity,
            severity=severity,
            device_id=device_id,
            detected_at=now,
            metric=metric,
            observed_value=round(value, 2),
            threshold=threshold,
            duration_seconds=duration_s,
            explanation=explanation,
            recommendation=recommendation,
        )

    # ── CPU ───────────────────────────────────────────────────────────────────
    if t.cpu_usage_percent is not None:
        cpu = t.cpu_usage_percent
        thr = THRESHOLDS["cpu_high"]
        if cpu >= thr["critical"]:
            dur = _duration("cpu_usage_percent", thr["critical"])
            issues.append(_make(
                "HIGH_CPU_USAGE", "CRITICAL",
                "cpu_usage_percent", cpu, thr["critical"], dur,
                f"CPU utilization is critically high at {cpu:.1f}%. "
                "Sustained high CPU may degrade system responsiveness.",
                "Identify and terminate or throttle high-CPU processes. "
                "Check for runaway processes, malware scans, or compilation jobs."
            ))
        elif cpu >= thr["high"]:
            dur = _duration("cpu_usage_percent", thr["high"])
            issues.append(_make(
                "HIGH_CPU_USAGE", "HIGH",
                "cpu_usage_percent", cpu, thr["high"], dur,
                f"CPU utilization is high at {cpu:.1f}%.",
                "Review top CPU-consuming processes. Close unnecessary applications."
            ))
        elif cpu >= thr["warning"]:
            dur = _duration("cpu_usage_percent", thr["warning"])
            issues.append(_make(
                "HIGH_CPU_USAGE", "WARNING",
                "cpu_usage_percent", cpu, thr["warning"], dur,
                f"CPU utilization is elevated at {cpu:.1f}%.",
                "Monitor CPU usage. Close background applications if not needed."
            ))

    # ── Memory ────────────────────────────────────────────────────────────────
    if t.memory_percent is not None:
        mem = t.memory_percent
        thr = THRESHOLDS["memory_pressure"]
        if mem >= thr["critical"]:
            dur = _duration("memory_percent", thr["critical"])
            issues.append(_make(
                "MEMORY_PRESSURE", "CRITICAL",
                "memory_percent", mem, thr["critical"], dur,
                f"Memory usage is critically high at {mem:.1f}%. "
                "System may be using swap or will become unresponsive.",
                "Immediately close high-memory applications. "
                "Restart memory-leaking services if identified."
            ))
        elif mem >= thr["high"]:
            dur = _duration("memory_percent", thr["high"])
            issues.append(_make(
                "MEMORY_PRESSURE", "HIGH",
                "memory_percent", mem, thr["high"], dur,
                f"Memory usage is high at {mem:.1f}%.",
                "Review high-memory processes. Consider closing unused applications."
            ))
        elif mem >= thr["warning"]:
            dur = _duration("memory_percent", thr["warning"])
            issues.append(_make(
                "MEMORY_PRESSURE", "WARNING",
                "memory_percent", mem, thr["warning"], dur,
                f"Memory usage is elevated at {mem:.1f}%.",
                "Monitor memory usage. Close background applications if not needed."
            ))

    # ── Disk Capacity ─────────────────────────────────────────────────────────
    if t.disk_usage_percent is not None:
        disk = t.disk_usage_percent
        thr = THRESHOLDS["disk_capacity"]
        if disk >= thr["critical"]:
            dur = _duration("disk_usage_percent", thr["critical"])
            issues.append(_make(
                "DISK_CAPACITY_CRITICAL", "CRITICAL",
                "disk_usage_percent", disk, thr["critical"], dur,
                f"Disk is nearly full at {disk:.1f}%. "
                "System operations may fail if disk reaches 100%.",
                "Free disk space immediately: delete temp files, move data, "
                "or expand storage."
            ))
        elif disk >= thr["high"]:
            dur = _duration("disk_usage_percent", thr["high"])
            issues.append(_make(
                "DISK_CAPACITY_HIGH", "HIGH",
                "disk_usage_percent", disk, thr["high"], dur,
                f"Disk usage is high at {disk:.1f}%.",
                "Clean up temp files and large unused files. "
                "Consider archiving or moving data."
            ))
        elif disk >= thr["warning"]:
            dur = _duration("disk_usage_percent", thr["warning"])
            issues.append(_make(
                "DISK_CAPACITY_WARNING", "WARNING",
                "disk_usage_percent", disk, thr["warning"], dur,
                f"Disk usage is elevated at {disk:.1f}%.",
                "Monitor disk usage and plan cleanup or expansion."
            ))

    # ── Battery ───────────────────────────────────────────────────────────────
    if t.battery_percent is not None and not getattr(t, "battery_plugged", True):
        bat = t.battery_percent
        thr = THRESHOLDS["battery_low"]
        if bat <= thr["critical"]:
            issues.append(_make(
                "BATTERY_CRITICAL", "CRITICAL",
                "battery_percent", bat, thr["critical"], 0,
                f"Battery is critically low at {bat:.0f}%.",
                "Connect to power immediately to avoid data loss."
            ))
        elif bat <= thr["high"]:
            issues.append(_make(
                "BATTERY_LOW", "HIGH",
                "battery_percent", bat, thr["high"], 0,
                f"Battery is low at {bat:.0f}%.",
                "Connect to power soon."
            ))
        elif bat <= thr["warning"]:
            issues.append(_make(
                "BATTERY_LOW", "WARNING",
                "battery_percent", bat, thr["warning"], 0,
                f"Battery is at {bat:.0f}%.",
                "Consider connecting to power."
            ))

    # ── ML Anomaly ────────────────────────────────────────────────────────────
    if prediction and getattr(prediction, "anomaly_label", None) == "YES":
        issues.append(_make(
            "ANOMALY_DETECTED", "HIGH",
            "anomaly_score", prediction.anomaly_score or 0.0, 0.0, 0,
            "The ML anomaly detector (Isolation Forest) flagged this telemetry "
            "as statistically unusual compared to the training baseline.",
            "Review recent system activity, installed software, and network "
            "connections for unexpected changes."
        ))

    # ── ML Risk ───────────────────────────────────────────────────────────────
    if prediction and prediction.risk_level in ("HIGH", "CRITICAL"):
        issues.append(_make(
            "ABNORMAL_SYSTEM_BEHAVIOR", "HIGH",
            "risk_level", prediction.prediction_probability or 0.0, 0.5, 0,
            f"ML model predicted {prediction.prediction} "
            f"(probability={prediction.prediction_probability:.0%}, "
            f"risk={prediction.risk_level}). "
            "This may reflect sustained resource pressure or unusual system state.",
            "Review active processes and recent system changes. "
            "Run a new prediction after reducing load to confirm recovery."
        ))

    return issues


def issues_to_recommendations(issues: List[DetectedIssue]) -> List[dict]:
    """Collapse issues into prioritized recommendations."""
    recs = []
    seen = set()
    for issue in sorted(issues, key=lambda i: ["INFO","WARNING","HIGH","CRITICAL"].index(i.severity), reverse=True):
        if issue.recommendation not in seen:
            seen.add(issue.recommendation)
            recs.append({
                "priority": issue.severity,
                "issue_type": issue.issue_type,
                "recommendation": issue.recommendation,
                "reason": issue.explanation,
            })
    return recs
