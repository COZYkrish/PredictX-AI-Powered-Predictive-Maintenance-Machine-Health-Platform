"""
system_state_service.py — Single Source of Truth for device state.

Every page (Dashboard, Devices, Analytics, Alerts) must derive its
health/risk/prediction/anomaly/issue values from this service.

DO NOT fabricate any data here. All values come from the database.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.device import Device
from backend.models.telemetry import TelemetrySample
from backend.models.prediction import Prediction
from backend.models.issue import Issue, IssueStatusEnum, IssueSeverityEnum
from backend.models.alert import Alert, AlertStatusEnum
from backend.services.health_engine import calculate_health_and_risk

logger = logging.getLogger(__name__)

# Issues that are still "active" (not resolved/dismissed)
_ACTIVE_ISSUE_STATUSES = [
    IssueStatusEnum.DETECTED,
    IssueStatusEnum.INVESTIGATING,
    IssueStatusEnum.ACTION_REQUIRED,
    IssueStatusEnum.VERIFYING,
    IssueStatusEnum.PERSISTING,
    IssueStatusEnum.ESCALATED,
]


def get_device_system_state(db: Session, device_id: str) -> Dict[str, Any]:
    """
    Return the complete, authoritative state snapshot for one device.

    All values come from actual DB records. Nothing is fabricated.
    This is the ONLY function that should be used to derive:
        - health score
        - risk level
        - presence/online status
        - active issue/alert counts
        - latest prediction
        - anomaly state
        - recommended action
    """
    # ── 1. Device ──────────────────────────────────────────────────────────────
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if device is None:
        raise ValueError(f"Device not found: {device_id}")

    # ── 2. Latest Telemetry ────────────────────────────────────────────────────
    latest_telemetry = (
        db.query(TelemetrySample)
        .filter(TelemetrySample.device_id == device_id)
        .order_by(TelemetrySample.timestamp_utc.desc())
        .first()
    )

    # ── 3. Latest Prediction ───────────────────────────────────────────────────
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.device_id == device_id)
        .order_by(Prediction.timestamp_utc.desc())
        .first()
    )

    # ── 4. Active Issues ───────────────────────────────────────────────────────
    active_issues: List[Issue] = (
        db.query(Issue)
        .filter(
            Issue.device_id == device_id,
            Issue.status.in_(_ACTIVE_ISSUE_STATUSES),
        )
        .order_by(Issue.detected_at.desc())
        .all()
    )

    # ── 5. Open Alerts ─────────────────────────────────────────────────────────
    open_alerts = (
        db.query(Alert)
        .filter(
            Alert.device_id == device_id,
            Alert.status == AlertStatusEnum.OPEN,
        )
        .count()
    )

    # ── 6. Health Engine ───────────────────────────────────────────────────────
    health_data = calculate_health_and_risk(db, device_id)
    health_score = health_data["health_score"]
    risk_level = health_data["risk_level"]

    # ── 7. Health Factors ──────────────────────────────────────────────────────
    health_factors = _derive_health_factors(
        latest_pred=latest_pred,
        active_issues=active_issues,
        health_score=health_score,
    )

    # ── 8. Health Status Label ─────────────────────────────────────────────────
    health_status = _health_status_label(health_score, risk_level)

    # ── 9. Recommendation ─────────────────────────────────────────────────────
    recommended_action = _build_recommendation(
        risk_level=risk_level,
        active_issues=active_issues,
        latest_pred=latest_pred,
    )

    # ── 10. ML Model Info ─────────────────────────────────────────────────────
    model_info = _build_model_info(latest_pred)

    # ── 11. Anomaly ───────────────────────────────────────────────────────────
    anomaly_label = latest_pred.anomaly_label if latest_pred else None
    anomaly_score = latest_pred.anomaly_score if latest_pred else None

    # Build list of active issue summaries
    active_issue_list = [
        {
            "id": i.id,
            "issue_type": i.issue_type,
            "severity": i.severity.value if hasattr(i.severity, "value") else i.severity,
            "status": i.status.value if hasattr(i.status, "value") else i.status,
            "current_value": i.current_value,
            "explanation": i.explanation,
            "detected_at": i.detected_at.isoformat() if i.detected_at else None,
        }
        for i in active_issues
    ]

    return {
        "device_id": device_id,
        "hostname": device.hostname,
        "display_name": device.display_name,
        "presence_status": device.presence_status,
        "last_seen_at": device.last_seen_at.isoformat() if device.last_seen_at else None,
        "is_online": device.is_online,

        "health_score": health_score,
        "health_status": health_status,
        "health_factors": health_factors,

        "risk_level": risk_level,

        "latest_prediction": {
            "id": latest_pred.id if latest_pred else None,
            "prediction": latest_pred.prediction if latest_pred else None,
            "prediction_probability": latest_pred.prediction_probability if latest_pred else None,
            "risk_level": latest_pred.risk_level if latest_pred else None,
            "timestamp": latest_pred.timestamp_utc.isoformat() if latest_pred else None,
        } if latest_pred else None,

        "anomaly": {
            "label": anomaly_label,
            "score": anomaly_score,
            "is_anomaly": anomaly_label == "YES",
        },

        "active_issue_count": len(active_issues),
        "active_alert_count": open_alerts,
        "active_issues": active_issue_list,

        "recommended_action": recommended_action,

        "model": model_info,

        "latest_telemetry_at": (
            latest_telemetry.timestamp_utc.isoformat() if latest_telemetry else None
        ),
    }


# ── Private helpers ────────────────────────────────────────────────────────────

def _health_status_label(health_score: float, risk_level: str) -> str:
    if risk_level == "CRITICAL" or health_score < 40:
        return "CRITICAL"
    if risk_level == "HIGH" or health_score < 60:
        return "AT_RISK"
    if risk_level == "MEDIUM" or health_score < 80:
        return "DEGRADED"
    return "HEALTHY"


def _derive_health_factors(
    latest_pred: Optional[Prediction],
    active_issues: List[Issue],
    health_score: float,
) -> List[str]:
    """
    Build a human-readable list of WHY the health score is what it is.
    Only real factors from actual DB state are included.
    """
    factors: List[str] = []

    # Issue-based factors
    for issue in active_issues:
        issue_type = issue.issue_type.replace("_", " ").title()
        sev = issue.severity.value if hasattr(issue.severity, "value") else issue.severity
        status = issue.status.value if hasattr(issue.status, "value") else issue.status
        val = f"{issue.current_value:.1f}%" if issue.current_value else ""
        factors.append(f"{issue_type} ({sev}) — {val} [{status}]")

    # Anomaly factor
    if latest_pred and latest_pred.anomaly_label == "YES":
        score_str = f", score={latest_pred.anomaly_score:.3f}" if latest_pred.anomaly_score is not None else ""
        factors.append(f"Anomaly detected by Isolation Forest{score_str}")

    # Prediction factor
    if latest_pred and latest_pred.prediction not in ("HEALTHY", None):
        prob = f"{latest_pred.prediction_probability * 100:.1f}%" if latest_pred.prediction_probability else ""
        factors.append(
            f"ML prediction: {latest_pred.prediction} ({prob}) from {latest_pred.model_name}"
        )

    return factors


def _build_recommendation(
    risk_level: str,
    active_issues: List[Issue],
    latest_pred: Optional[Prediction],
) -> str:
    """
    Generate recommendation from actual system state.
    Never returns "healthy" when risk is HIGH.
    """
    if active_issues:
        # Surface the highest-severity issue
        severity_rank = {"INFO": 0, "WARNING": 1, "HIGH": 2, "CRITICAL": 3}
        worst = max(
            active_issues,
            key=lambda i: severity_rank.get(
                i.severity.value if hasattr(i.severity, "value") else i.severity, 0
            ),
        )
        issue_label = worst.issue_type.replace("_", " ").title()
        val = f" ({worst.current_value:.1f}%)" if worst.current_value else ""
        status = worst.status.value if hasattr(worst.status, "value") else worst.status

        if status == "VERIFYING":
            return (
                f"Verifying {issue_label}{val} — monitoring telemetry to confirm resolution."
            )
        if status in ("PERSISTING", "ESCALATED"):
            return (
                f"{issue_label} is persisting{val}. Escalation required — review top processes and system load."
            )
        return (
            f"Active {issue_label} detected{val}. Investigate top consuming processes and consider remediation."
        )

    if latest_pred and latest_pred.anomaly_label == "YES":
        return (
            "Anomaly detected in system behaviour. Review recent metric spikes and correlate with process activity."
        )

    if risk_level in ("HIGH", "CRITICAL"):
        return (
            f"Risk level is {risk_level} — check system telemetry and recent prediction history for contributing factors."
        )

    if risk_level == "MEDIUM":
        return "System shows moderate stress. Monitor closely and investigate if metrics continue to rise."

    return "System is operating normally. No action required."


def _build_model_info(latest_pred: Optional[Prediction]) -> Dict[str, Any]:
    """Use the prediction record to report what model was actually used."""
    from backend.ml.adapter import ml_adapter
    adapter_status = ml_adapter.get_status()

    if latest_pred:
        return {
            "name": latest_pred.model_name,
            "version": latest_pred.model_version,
            "status": adapter_status.get("model_status", "UNKNOWN"),
            "is_baseline": latest_pred.model_name in ("MajorityBaseline", "majority_baseline", "mock_model"),
            "mode": adapter_status.get("mode", "unknown"),
        }

    return {
        "name": adapter_status.get("model_name", "Unknown"),
        "version": adapter_status.get("model_version", "Unknown"),
        "status": adapter_status.get("model_status", "UNKNOWN"),
        "is_baseline": True,
        "mode": adapter_status.get("mode", "unknown"),
    }


def get_state_debug(db: Session, device_id: str) -> Dict[str, Any]:
    """
    Admin-only endpoint: full raw trace of device state for debugging.
    """
    state = get_device_system_state(db, device_id)

    # Add raw DB values for deeper debug
    latest_pred_raw = (
        db.query(Prediction)
        .filter(Prediction.device_id == device_id)
        .order_by(Prediction.timestamp_utc.desc())
        .first()
    )

    latest_tel = (
        db.query(TelemetrySample)
        .filter(TelemetrySample.device_id == device_id)
        .order_by(TelemetrySample.timestamp_utc.desc())
        .first()
    )

    device = db.query(Device).filter(Device.device_id == device_id).first()

    from backend.ml.adapter import ml_adapter

    state["_debug"] = {
        "raw_device": {
            "last_seen_at": device.last_seen_at.isoformat() if device.last_seen_at else None,
            "is_online": device.is_online,
            "presence_status": device.presence_status,
        },
        "raw_latest_prediction": {
            "id": latest_pred_raw.id if latest_pred_raw else None,
            "prediction": latest_pred_raw.prediction if latest_pred_raw else None,
            "prediction_probability": latest_pred_raw.prediction_probability if latest_pred_raw else None,
            "risk_level": latest_pred_raw.risk_level if latest_pred_raw else None,
            "health_score": latest_pred_raw.health_score if latest_pred_raw else None,
            "anomaly_label": latest_pred_raw.anomaly_label if latest_pred_raw else None,
            "anomaly_score": latest_pred_raw.anomaly_score if latest_pred_raw else None,
            "model_name": latest_pred_raw.model_name if latest_pred_raw else None,
            "timestamp_utc": latest_pred_raw.timestamp_utc.isoformat() if latest_pred_raw else None,
        },
        "raw_latest_telemetry": {
            "id": latest_tel.id if latest_tel else None,
            "timestamp_utc": latest_tel.timestamp_utc.isoformat() if latest_tel else None,
            "cpu_usage_percent": latest_tel.cpu_usage_percent if latest_tel else None,
            "memory_percent": latest_tel.memory_percent if latest_tel else None,
            "disk_usage_percent": latest_tel.disk_usage_percent if latest_tel else None,
        },
        "ml_adapter": ml_adapter.get_status(),
    }

    return state
