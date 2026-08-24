from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from backend.models.prediction import Prediction
from backend.models.issue import Issue, IssueStatusEnum, IssueSeverityEnum

logger = logging.getLogger(__name__)

def calculate_health_and_risk(db: Session, device_id: str):
    """
    Computes a deterministic health score (0-100) and risk level.
    It combines the latest ML prediction with active issues (which may include anomalies).
    Prevents double counting by capping deductions.
    """
    # 1. Base health from ML
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.device_id == device_id)
        .order_by(Prediction.timestamp_utc.desc())
        .first()
    )

    base_score = 100
    base_risk = "LOW"
    
    if latest_pred and latest_pred.health_score is not None:
        base_score = latest_pred.health_score
        base_risk = latest_pred.risk_level or "LOW"

    # 2. Check active issues
    active_issues = (
        db.query(Issue)
        .filter(
            Issue.device_id == device_id,
            Issue.status.in_([
                IssueStatusEnum.DETECTED,
                IssueStatusEnum.INVESTIGATING,
                IssueStatusEnum.ACTION_REQUIRED,
                IssueStatusEnum.VERIFYING,
                IssueStatusEnum.PERSISTING,
                IssueStatusEnum.ESCALATED
            ])
        )
        .all()
    )

    issue_deduction = 0
    max_severity_found = "INFO"
    
    severity_rank = {"INFO": 0, "WARNING": 1, "HIGH": 2, "CRITICAL": 3}
    
    for issue in active_issues:
        sev = issue.severity.value if hasattr(issue.severity, 'value') else issue.severity
        if severity_rank.get(sev, 0) > severity_rank.get(max_severity_found, 0):
            max_severity_found = sev
            
        if sev == "CRITICAL":
            issue_deduction += 30
        elif sev == "HIGH":
            issue_deduction += 20
        elif sev == "WARNING":
            issue_deduction += 10
            
    # Cap total issue deduction to prevent dropping to 0 just from multiple warnings
    issue_deduction = min(issue_deduction, 50)
    
    final_score = max(0, min(100, base_score - issue_deduction))
    
    # Determine risk from final score or highest issue severity
    final_risk = base_risk
    
    # If ML says LOW but we have a CRITICAL issue, elevate to CRITICAL
    if severity_rank.get(max_severity_found, 0) > severity_rank.get(final_risk, 0):
        final_risk = max_severity_found

    # Further bound risk by score just in case base_score was very low but no issues exist
    if final_score < 40 and severity_rank.get(final_risk, 0) < 3:
        final_risk = "CRITICAL"
    elif final_score < 70 and severity_rank.get(final_risk, 0) < 2:
        final_risk = "HIGH"
    elif final_score < 90 and severity_rank.get(final_risk, 0) < 1:
        final_risk = "WARNING"

    if final_risk == "WARNING": 
        final_risk = "MEDIUM" # Map warning to medium if risk model uses MEDIUM
        
    # Ensure standard Risk enums
    if final_risk not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        if final_risk == "WARNING":
            final_risk = "MEDIUM"
        else:
            final_risk = "LOW"

    return {
        "health_score": round(final_score, 1),
        "risk_level": final_risk,
        "last_prediction_at": latest_pred.timestamp_utc if latest_pred else None
    }
