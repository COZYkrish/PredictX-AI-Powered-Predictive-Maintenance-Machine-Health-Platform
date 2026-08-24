"""
Alert Service — creates descriptive, deduplicated alerts from real prediction+issue data.

Changes from original:
- Alert message contains actual metric, observed value, and recommendation.
- Deduplication: one active alert per (device_id, alert_type). On resolution
  the alert is marked RESOLVED; a new alert is created only when the condition
  reappears after resolution.
- Calls issue_detector to extract structured issues from telemetry.
"""

import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from backend.models.prediction import Prediction
from backend.models.telemetry import TelemetrySample
from backend.repositories.alert import alert as alert_repo
from backend.repositories.alert import AlertCreate
from backend.config import settings
from backend.services.issue_detector import detect_issues, DetectedIssue
from typing import List

logger = logging.getLogger(__name__)

_SEVERITY_RANK = {"INFO": 0, "WARNING": 1, "HIGH": 2, "CRITICAL": 3}


def evaluate_prediction_for_alerts(db: Session, prediction: Prediction):
    """
    Main entry point called by prediction_worker after a successful inference.
    Fetches recent telemetry, runs issue detection, and creates/updates alerts.
    """
    # ── Fetch latest + window telemetry for duration calculation ──────────────
    latest = (
        db.query(TelemetrySample)
        .filter(TelemetrySample.device_id == prediction.device_id)
        .order_by(TelemetrySample.timestamp_utc.desc())
        .first()
    )
    if not latest:
        logger.warning(f"No telemetry found for alert evaluation on {prediction.device_id}")
        return

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
    window = (
        db.query(TelemetrySample)
        .filter(
            TelemetrySample.device_id == prediction.device_id,
            TelemetrySample.timestamp_utc >= cutoff,
        )
        .order_by(TelemetrySample.timestamp_utc.asc())
        .all()
    )

    # ── Detect issues ─────────────────────────────────────────────────────────
    issues: List[DetectedIssue] = detect_issues(
        device_id=prediction.device_id,
        latest_telemetry=latest,
        prediction=prediction,
        recent_telemetry_window=window,
    )

    # ── Create/deduplicate alerts ─────────────────────────────────────────────
    for issue in issues:
        # Skip INFO-level issues — they don't warrant alerts
        if issue.severity == "INFO":
            continue

        alert_type = issue.issue_type

        active = alert_repo.get_active_for_device(
            db, device_id=prediction.device_id, alert_type=alert_type
        )
        if active:
            # Condition is still present — don't duplicate
            # Optionally update severity if it escalated
            if _SEVERITY_RANK.get(issue.severity, 0) > _SEVERITY_RANK.get(active.severity, 0):
                active.severity = issue.severity
                active.message = _build_message(issue)
                db.commit()
                logger.info(f"Alert {active.id} escalated to {issue.severity}")
            continue

        # Create new alert
        alert_in = AlertCreate(
            device_id=prediction.device_id,
            prediction_id=prediction.id,
            alert_type=alert_type,
            severity=issue.severity,
            title=_build_title(issue),
            message=_build_message(issue),
        )
        new_alert = alert_repo.create(db, obj_in=alert_in)
        logger.info(
            f"Alert created: {new_alert.id} type={alert_type} "
            f"severity={issue.severity} device={prediction.device_id}"
        )

        # Generate Maintenance Record from alert
        _generate_maintenance_record(db, new_alert, issue)

    # ── Resolve alerts for issues that are no longer present ─────────────────
    active_issue_types = {i.issue_type for i in issues}
    _resolve_cleared_alerts(db, prediction.device_id, active_issue_types)


def _build_title(issue: DetectedIssue) -> str:
    titles = {
        "HIGH_CPU_USAGE": "High CPU Utilization",
        "MEMORY_PRESSURE": "Memory Pressure",
        "DISK_CAPACITY_CRITICAL": "Critical Disk Capacity",
        "DISK_CAPACITY_HIGH": "High Disk Usage",
        "DISK_CAPACITY_WARNING": "Elevated Disk Usage",
        "BATTERY_CRITICAL": "Battery Critically Low",
        "BATTERY_LOW": "Battery Low",
        "ANOMALY_DETECTED": "Anomaly Detected",
        "ABNORMAL_SYSTEM_BEHAVIOR": "Abnormal System Behavior",
    }
    return titles.get(issue.issue_type, issue.issue_type.replace("_", " ").title())


def _build_message(issue: DetectedIssue) -> str:
    duration_str = ""
    if issue.duration_seconds > 60:
        mins = issue.duration_seconds // 60
        duration_str = f" sustained for ~{mins} minute{'s' if mins != 1 else ''}"
    elif issue.duration_seconds > 0:
        duration_str = f" sustained for ~{issue.duration_seconds}s"

    return (
        f"{issue.explanation}"
        f"{' Observed: ' + str(issue.observed_value) + '% (threshold: ' + str(issue.threshold) + '%)' if issue.threshold > 0 else ''}"
        f"{duration_str}. "
        f"Recommendation: {issue.recommendation}"
    )


def _generate_maintenance_record(db: Session, alert, issue: DetectedIssue):
    """Automatically create a maintenance record based on the alert."""
    from backend.models.maintenance import MaintenanceRecord, MaintenanceStatusEnum
    import uuid
    
    priority_map = {
        "CRITICAL": "HIGH",
        "HIGH": "HIGH",
        "WARNING": "MEDIUM",
        "INFO": "LOW"
    }
    
    new_record = MaintenanceRecord(
        id=str(uuid.uuid4()),
        device_id=alert.device_id,
        alert_id=alert.id,
        title=f"Maintenance Required: {_build_title(issue)}",
        description=issue.recommendation,
        priority=priority_map.get(issue.severity, "MEDIUM"),
        status=MaintenanceStatusEnum.RECOMMENDED
    )
    db.add(new_record)
    db.commit()


def _resolve_cleared_alerts(
    db: Session, device_id: str, active_issue_types: set
):
    """Mark as RESOLVED any open alerts for conditions that no longer exist."""
    from backend.models.alert import Alert
    open_alerts = (
        db.query(Alert)
        .filter(
            Alert.device_id == device_id,
            Alert.status == "OPEN",
        )
        .all()
    )
    for alert in open_alerts:
        if alert.alert_type not in active_issue_types:
            alert.status = "RESOLVED"
            alert.resolved_at = datetime.now(timezone.utc)
            logger.info(f"Alert {alert.id} RESOLVED (condition cleared)")
    db.commit()
