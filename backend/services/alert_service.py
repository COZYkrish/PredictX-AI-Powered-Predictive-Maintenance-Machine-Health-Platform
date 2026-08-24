import logging
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from typing import List

from backend.models.prediction import Prediction
from backend.models.telemetry import TelemetrySample
from backend.models.issue import Issue, IssueStatusEnum
from backend.models.alert import Alert, AlertStatusEnum
from backend.models.maintenance import MaintenanceRecord, MaintenanceStatusEnum
from backend.services.issue_detector import detect_issues, DetectedIssue
from backend.services.issue_investigator import investigate_issue
from backend.services.recommendation_engine import generate_recommendation

logger = logging.getLogger(__name__)

_SEVERITY_RANK = {"INFO": 0, "WARNING": 1, "HIGH": 2, "CRITICAL": 3}

def evaluate_prediction_for_alerts(db: Session, prediction: Prediction):
    """
    Main entry point called by prediction_worker after a successful inference.
    Fetches recent telemetry, runs issue detection, and creates/updates issues and alerts.
    """
    latest = (
        db.query(TelemetrySample)
        .filter(TelemetrySample.device_id == prediction.device_id)
        .order_by(TelemetrySample.timestamp_utc.desc())
        .first()
    )
    if not latest:
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

    # 1. Detect raw issues
    detected_issues: List[DetectedIssue] = detect_issues(
        device_id=prediction.device_id,
        latest_telemetry=latest,
        prediction=prediction,
        recent_telemetry_window=window,
    )

    active_fingerprints = set()

    # 2. Process each detected issue
    for d_issue in detected_issues:
        if d_issue.severity == "INFO":
            continue

        fingerprint = (d_issue.device_id, d_issue.issue_type, d_issue.condition_band)
        active_fingerprints.add(fingerprint)

        # Check for existing active issue
        existing_issue = (
            db.query(Issue)
            .filter(
                Issue.device_id == d_issue.device_id,
                Issue.issue_type == d_issue.issue_type,
                Issue.condition_band == d_issue.condition_band,
                Issue.status.in_([
                    IssueStatusEnum.DETECTED,
                    IssueStatusEnum.INVESTIGATING,
                    IssueStatusEnum.ACTION_REQUIRED,
                    IssueStatusEnum.VERIFYING,
                    IssueStatusEnum.PERSISTING,
                    IssueStatusEnum.ESCALATED
                ])
            )
            .first()
        )

        if existing_issue:
            # Update existing issue
            existing_issue.current_value = d_issue.observed_value
            existing_issue.duration_seconds = d_issue.duration_seconds
            existing_issue.updated_at = datetime.now(timezone.utc)
            
            # Escalate severity if needed
            if _SEVERITY_RANK.get(d_issue.severity, 0) > _SEVERITY_RANK.get(existing_issue.severity.value if hasattr(existing_issue.severity, 'value') else existing_issue.severity, 0):
                existing_issue.severity = d_issue.severity
                
            db.commit()
        else:
            # Create new issue
            new_issue = Issue(
                id=str(uuid.uuid4()),
                device_id=d_issue.device_id,
                issue_type=d_issue.issue_type,
                condition_band=d_issue.condition_band,
                severity=d_issue.severity,
                status=IssueStatusEnum.DETECTED,
                detected_at=d_issue.detected_at,
                current_value=d_issue.observed_value,
                threshold=d_issue.threshold,
                duration_seconds=d_issue.duration_seconds,
                explanation=d_issue.explanation,
                prediction_id=prediction.id,
                source_type="ML_PREDICTION" if d_issue.issue_type in ["ANOMALY_DETECTED", "ABNORMAL_SYSTEM_BEHAVIOR"] else "TELEMETRY",
                source_id=prediction.id
            )
            db.add(new_issue)
            db.commit()
            db.refresh(new_issue)
            
            # Run investigation and recommendations
            investigate_issue(db, new_issue, window)
            generate_recommendation(db, new_issue)
            
            new_issue.status = IssueStatusEnum.ACTION_REQUIRED
            db.commit()
            
            # Create Alert
            alert = Alert(
                id=str(uuid.uuid4()),
                device_id=new_issue.device_id,
                issue_id=new_issue.id,
                prediction_id=prediction.id,
                alert_type=new_issue.issue_type,
                severity=new_issue.severity,
                title=_build_title(new_issue),
                message=new_issue.explanation,
                status=AlertStatusEnum.OPEN
            )
            db.add(alert)
            db.commit()
            
            # Create Maintenance Record
            _generate_maintenance_record(db, alert, new_issue)

    # 3. Auto-resolve issues that are no longer detected (unless in VERIFYING state)
    _resolve_cleared_issues(db, prediction.device_id, active_fingerprints)

def _build_title(issue: Issue) -> str:
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

def _generate_maintenance_record(db: Session, alert: Alert, issue: Issue):
    priority_map = {
        "CRITICAL": "HIGH",
        "HIGH": "HIGH",
        "WARNING": "MEDIUM",
        "INFO": "LOW"
    }
    
    sev = issue.severity.value if hasattr(issue.severity, 'value') else issue.severity
    new_record = MaintenanceRecord(
        id=str(uuid.uuid4()),
        device_id=issue.device_id,
        issue_id=issue.id,
        alert_id=alert.id,
        title=f"Maintenance Required: {_build_title(issue)}",
        description=issue.recommendation or "Requires investigation.",
        priority=priority_map.get(sev, "MEDIUM"),
        status=MaintenanceStatusEnum.RECOMMENDED
    )
    db.add(new_record)
    db.commit()

def _resolve_cleared_issues(db: Session, device_id: str, active_fingerprints: set):
    open_issues = (
        db.query(Issue)
        .filter(
            Issue.device_id == device_id,
            Issue.status.in_([
                IssueStatusEnum.DETECTED,
                IssueStatusEnum.INVESTIGATING,
                IssueStatusEnum.ACTION_REQUIRED,
                IssueStatusEnum.PERSISTING,
                IssueStatusEnum.ESCALATED
            ])
        )
        .all()
    )
    
    for issue in open_issues:
        fingerprint = (issue.device_id, issue.issue_type, issue.condition_band)
        if fingerprint not in active_fingerprints:
            issue.status = IssueStatusEnum.RESOLVED
            issue.resolved_at = datetime.now(timezone.utc)
            
            # Resolve related alerts
            alerts = db.query(Alert).filter(Alert.issue_id == issue.id, Alert.status == AlertStatusEnum.OPEN).all()
            for a in alerts:
                a.status = AlertStatusEnum.RESOLVED
                a.resolved_at = datetime.now(timezone.utc)
                
    db.commit()
