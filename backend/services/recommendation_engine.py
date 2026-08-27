"""
recommendation_engine.py — Generates specific, evidence-driven recommendations.

Rules:
- Every recommendation MUST include actual observed values from the issue record.
- If top_processes are available, the recommendation names them.
- Generic templates are ONLY used as a final fallback.
- No fabricated data. All values must come from actual DB records.
"""

import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.models.issue import Issue

logger = logging.getLogger(__name__)


def generate_recommendation(db: Session, issue: Issue) -> None:
    """
    Build a specific, evidence-driven recommendation for the given issue.
    Reads top_processes, current_value, baseline_value, and threshold
    from the issue itself and its linked telemetry.

    Does NOT commit — caller manages the transaction.
    """
    # Pull real context from the issue record
    current = issue.current_value
    baseline = issue.baseline_value
    threshold = issue.threshold
    processes: List[Dict[str, Any]] = _get_top_processes(db, issue)

    if issue.issue_type == "HIGH_CPU_USAGE":
        _rec_high_cpu(issue, current, baseline, threshold, processes)

    elif issue.issue_type == "MEMORY_PRESSURE":
        _rec_memory_pressure(issue, current, baseline, threshold, processes)

    elif "DISK_CAPACITY" in issue.issue_type:
        _rec_disk_capacity(issue, current, threshold)

    elif "BATTERY" in issue.issue_type:
        _rec_battery(issue, current)

    elif issue.issue_type == "ANOMALY_DETECTED":
        _rec_anomaly(issue, current, baseline, processes)

    elif issue.issue_type == "ABNORMAL_SYSTEM_BEHAVIOR":
        _rec_anomaly(issue, current, baseline, processes)

    else:
        _rec_generic(issue, current)


# ── Issue-specific builders ───────────────────────────────────────────────────

def _rec_high_cpu(
    issue: Issue,
    current: Optional[float],
    baseline: Optional[float],
    threshold: Optional[float],
    processes: List[Dict[str, Any]],
) -> None:
    val_str = f"{current:.1f}%" if current is not None else "elevated"
    thr_str = f"{threshold:.0f}%" if threshold is not None else "normal"
    base_str = f"{baseline:.1f}%" if baseline is not None else "unknown"

    proc_lines = _format_top_procs(processes, metric="cpu_percent", min_pct=2.0, limit=5)

    lines = [
        f"CPU is at {val_str} (threshold {thr_str}, recent average {base_str}).",
        "",
    ]

    if proc_lines:
        lines += [
            "TOP CPU-CONSUMING PROCESSES RIGHT NOW:",
            *[f"  • {p}" for p in proc_lines],
            "",
            "WHAT TO DO:",
            "  1. Open Task Manager (Ctrl+Shift+Esc) → Performance → CPU.",
            f"  2. Look for the processes listed above.",
            "  3. If a process is unexpected, right-click → End Task (save work first).",
            "  4. If it is a browser, close unused tabs.",
            "  5. If it is a background updater, let it finish or disable auto-update.",
            "  6. Wait 30–60 seconds and return here.",
            "  7. Click 'Start Verification' -- target is CPU below " + thr_str + ".",
        ]
    else:
        lines += [
            "WHAT TO DO:",
            "  1. Open Task Manager (Ctrl+Shift+Esc) → Processes tab.",
            "  2. Click the CPU column header to sort descending.",
            "  3. Identify any process consuming >20% CPU consistently.",
            "  4. Close or restart that application.",
            f"  5. Wait until CPU drops below {thr_str}.",
            "  6. Click 'Start Verification'.",
        ]

    issue.recommendation = "\n".join(lines)
    issue.verification_metric = "cpu_usage_percent"
    issue.verification_operator = "<"
    issue.verification_target = threshold or 75.0
    issue.verification_duration_seconds = 60
    issue.verification_required_consecutive_samples = 3


def _rec_memory_pressure(
    issue: Issue,
    current: Optional[float],
    baseline: Optional[float],
    threshold: Optional[float],
    processes: List[Dict[str, Any]],
) -> None:
    val_str = f"{current:.1f}%" if current is not None else "elevated"
    thr_str = f"{threshold:.0f}%" if threshold is not None else "80"
    base_str = f"{baseline:.1f}%" if baseline is not None else "unknown"
    target = threshold - 5 if threshold else 75.0

    proc_lines = _format_top_procs(processes, metric="memory_percent", min_pct=1.0, limit=5)

    lines = [
        f"Memory usage is at {val_str} (threshold {thr_str}, recent average {base_str}).",
        "",
    ]

    if proc_lines:
        lines += [
            "TOP MEMORY-CONSUMING PROCESSES RIGHT NOW:",
            *[f"  • {p}" for p in proc_lines],
            "",
            "WHAT TO DO:",
            "  1. Open Task Manager (Ctrl+Shift+Esc) → Processes tab.",
            "  1. Open Task Manager (Ctrl+Shift+Esc) -> Processes tab.",
            "  2. Click the Memory column to sort descending.",
            f"  3. Focus on the processes listed above — they are consuming most of your RAM.",
            "  4. Close browser tabs you don't need (browsers are heavy RAM users).",
            "  5. Close any applications listed above that you aren't actively using.",
            "  6. If a process looks unfamiliar, search online for its name before ending it.",
            "  7. After closing apps, wait 1–2 minutes for memory to be released.",
            "  8. Click 'Start Verification' -- target is memory below " + f"{target:.0f}%" + ".",
        ]
    else:
        lines += [
            "WHAT TO DO:",
            "  1. Open Task Manager (Ctrl+Shift+Esc) -> Processes tab.",
            "  2. Click the Memory column to sort descending.",
            "  3. Close browsers, IDEs, or other heavy applications you are not using.",
            "  4. If memory stays high after closing apps, a restart may be needed.",
            f"  5. Target: memory below {target:.0f}%.",
            "  6. Click 'Start Verification'.",
        ]

    issue.recommendation = "\n".join(lines)
    issue.verification_metric = "memory_percent"
    issue.verification_operator = "<"
    issue.verification_target = target
    issue.verification_duration_seconds = 120
    issue.verification_required_consecutive_samples = 3


def _rec_disk_capacity(
    issue: Issue,
    current: Optional[float],
    threshold: Optional[float],
) -> None:
    val_str = f"{current:.1f}%" if current is not None else "high"
    thr_str = f"{threshold:.0f}%" if threshold is not None else "85"

    issue.recommendation = "\n".join([
        f"Disk usage is at {val_str} (threshold {thr_str}).",
        "",
        "WHAT TO DO:",
        "  1. Open Settings → System → Storage.",
        "  2. Click 'Temporary files' → select all → Remove files.",
        "  3. Open Recycle Bin → Empty it.",
        "  4. Run Disk Cleanup (search in Start menu).",
        "  5. Move large files (videos, archives) to an external drive if needed.",
        "  6. Uninstall applications you no longer use.",
        f"  7. Target: disk below {thr_str}%.",
        "  8. Click 'Start Verification'.",
    ])
    issue.verification_metric = "disk_usage_percent"
    issue.verification_operator = "<"
    issue.verification_target = threshold or 80.0
    issue.verification_duration_seconds = 30
    issue.verification_required_consecutive_samples = 1


def _rec_battery(issue: Issue, current: Optional[float]) -> None:
    val_str = f"{current:.0f}%" if current is not None else "low"
    issue.recommendation = "\n".join([
        f"Battery is at {val_str}.",
        "",
        "WHAT TO DO:",
        "  1. Connect the device to its power adapter immediately.",
        "  2. Verify the charging LED or Windows battery icon shows 'Charging'.",
        "  3. Click 'Start Verification'.",
    ])
    issue.verification_metric = "battery_plugged"
    issue.verification_operator = "=="
    issue.verification_target = 1.0
    issue.verification_duration_seconds = 10
    issue.verification_required_consecutive_samples = 1


def _rec_anomaly(
    issue: Issue,
    current: Optional[float],
    baseline: Optional[float],
    processes: List[Dict[str, Any]],
) -> None:
    """
    For anomaly detections, the recommendation is built from whichever
    metrics are actually elevated — CPU, memory, disk — and names the
    top processes if available.
    """
    score_str = f"{current:.3f}" if current is not None else "flagged"

    cpu_procs = _format_top_procs(processes, metric="cpu_percent", min_pct=5.0, limit=3)
    mem_procs = _format_top_procs(processes, metric="memory_percent", min_pct=3.0, limit=3)

    lines = [
        "The ML anomaly detector flagged this telemetry as statistically unusual.",
        f"Anomaly score: {score_str} (negative = anomalous, more negative = more unusual).",
        "",
    ]

    if cpu_procs or mem_procs:
        lines.append("PROCESSES ACTIVE AT DETECTION TIME:")
        if cpu_procs:
            lines.append("  High CPU:")
            lines += [f"    • {p}" for p in cpu_procs]
        if mem_procs:
            lines.append("  High Memory:")
            lines += [f"    • {p}" for p in mem_procs]
        lines.append("")
        lines += [
            "WHAT TO DO:",
            "  1. Check if the processes listed above are expected.",
            "  2. If you see an unfamiliar process, search its name online to verify it is safe.",
            "  3. Open Task Manager and check if CPU or RAM is still elevated.",
            "  4. If a specific app is causing load, close or restart it.",
            "  5. If everything looks normal, this may have been a temporary spike.",
            "  6. Click 'Start Verification' — the anomaly detector will check the next 60 seconds of telemetry.",
            "  7. If it resolves, the issue will be marked RESOLVED automatically.",
        ]
    else:
        lines += [
            "WHAT TO DO:",
            "  1. Open Task Manager (Ctrl+Shift+Esc).",
            "  2. Check CPU, Memory, Disk, and Network tabs for any unusual spikes.",
            "  3. Look at the Processes tab — sort by CPU then by Memory.",
            "  4. Compare to what you were doing at the detection time above.",
            "  5. If a suspicious process is running, search its name online.",
            "  6. If everything looks normal, this may have been a transient event.",
            "  7. Click 'Start Verification' to monitor the next 60 seconds.",
        ]

    issue.recommendation = "\n".join(lines)
    issue.verification_metric = "anomaly_label"
    issue.verification_operator = "=="
    issue.verification_target = 0.0
    issue.verification_duration_seconds = 60
    issue.verification_required_consecutive_samples = 2


def _rec_generic(issue: Issue, current: Optional[float]) -> None:
    val_str = f"{current:.1f}%" if current is not None else "elevated"
    issue.recommendation = "\n".join([
        f"System metric is at {val_str}.",
        "",
        "WHAT TO DO:",
        "  1. Open Task Manager and check which resource is under pressure.",
        "  2. Close applications you are not actively using.",
        "  3. Reduce system workload and wait 1–2 minutes.",
        "  4. Click 'Start Verification'.",
    ])
    issue.verification_metric = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_top_processes(db: Session, issue: Issue) -> List[Dict[str, Any]]:
    """
    Fetch top_processes from the telemetry sample that triggered this issue.
    Uses source_id (telemetry sample ID) if available, otherwise falls back
    to the latest telemetry for the device.
    """
    from backend.models.telemetry import TelemetrySample

    sample = None

    # Try to load the exact triggering sample
    if issue.source_type == "TELEMETRY" and issue.source_id:
        sample = (
            db.query(TelemetrySample)
            .filter(TelemetrySample.id == issue.source_id)
            .first()
        )

    # Fall back to latest sample for the device
    if sample is None:
        sample = (
            db.query(TelemetrySample)
            .filter(TelemetrySample.device_id == issue.device_id)
            .order_by(TelemetrySample.timestamp_utc.desc())
            .first()
        )

    if sample and sample.top_processes:
        return sample.top_processes

    return []


def _format_top_procs(
    processes: List[Dict[str, Any]],
    metric: str,
    min_pct: float,
    limit: int,
) -> List[str]:
    """
    Return formatted strings for top processes sorted by `metric`.
    Only includes processes above min_pct threshold.
    """
    if not processes:
        return []

    sorted_procs = sorted(
        processes,
        key=lambda p: p.get(metric, 0),
        reverse=True,
    )

    lines = []
    for p in sorted_procs[:limit]:
        val = p.get(metric, 0)
        if val < min_pct:
            continue
        name = p.get("process_name") or p.get("name") or "Unknown"
        pid = p.get("pid", "")
        pid_str = f" (PID {pid})" if pid else ""
        cpu_str = f"CPU {p.get('cpu_percent', 0):.1f}%" if metric == "cpu_percent" else ""
        mem_str = f"RAM {p.get('memory_percent', 0):.1f}%" if metric == "memory_percent" else ""
        detail = cpu_str or mem_str
        lines.append(f"{name}{pid_str} — {detail}")

    return lines
