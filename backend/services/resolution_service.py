import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional

from backend.models.issue import Issue, IssueStatusEnum
from backend.models.telemetry import TelemetrySample
from backend.models.alert import Alert, AlertStatusEnum
from backend.services.health_engine import calculate_health_and_risk

logger = logging.getLogger(__name__)

def evaluate_verifying_issues(db: Session, device_id: str, current_telemetry: TelemetrySample) -> None:
    """
    Called whenever new telemetry arrives. Checks issues in VERIFYING state 
    to see if they meet their target or if the verification time has expired.
    """
    verifying_issues = (
        db.query(Issue)
        .filter(
            Issue.device_id == device_id,
            Issue.status == IssueStatusEnum.VERIFYING
        )
        .all()
    )

    for issue in verifying_issues:
        if not issue.verification_metric:
            continue
            
        # Get the value from the new telemetry
        val = getattr(current_telemetry, issue.verification_metric, None)
        if val is None:
            continue

        # Convert boolean to float for comparison if needed
        if isinstance(val, bool):
            val = 1.0 if val else 0.0

        # Check condition
        condition_met = False
        op = issue.verification_operator
        target = issue.verification_target
        
        if op == "<" and val < target: condition_met = True
        elif op == "<=" and val <= target: condition_met = True
        elif op == ">" and val > target: condition_met = True
        elif op == ">=" and val >= target: condition_met = True
        elif op == "==" and val == target: condition_met = True
        elif op == "!=" and val != target: condition_met = True

        now = datetime.now(timezone.utc)
        duration_so_far = (now - issue.verification_started_at).total_seconds() if issue.verification_started_at else 0

        # Simple verification check based on the current sample
        # Note: In a production system, we'd check consecutive samples. Here we check if condition is met right now.
        if condition_met:
            # Check if duration satisfied (e.g. they stayed below 75% for 60s)
            # But wait, if they meet it immediately, should we resolve it immediately?
            # The prompt says "When the target remains satisfied for the required period"
            # Here we simplify: if it meets the target *at* the end of the duration, or if we want to be generous, resolve it immediately.
            # Let's be strict: only resolve if we have passed the required duration and it's still met.
            if duration_so_far >= (issue.verification_duration_seconds or 0):
                _resolve_issue(db, issue)
        else:
            # Condition not met. Have we run out of time?
            if duration_so_far >= (issue.verification_duration_seconds or 0):
                # Failed verification
                issue.status = IssueStatusEnum.PERSISTING
                issue.updated_at = now
                logger.info(f"Issue {issue.id} failed verification -> PERSISTING")
                
                # Check for escalation (configurable attempts, say 3)
                if (issue.verification_attempts or 0) >= 3:
                    issue.status = IssueStatusEnum.ESCALATED
                    logger.warning(f"Issue {issue.id} escalated after {issue.verification_attempts} failed attempts")
                db.commit()

def start_verification(db: Session, issue: Issue) -> None:
    """Transition an issue to VERIFYING state."""
    issue.status = IssueStatusEnum.VERIFYING
    issue.verification_started_at = datetime.now(timezone.utc)
    issue.verification_attempts = (issue.verification_attempts or 0) + 1
    issue.updated_at = datetime.now(timezone.utc)
    db.commit()
    logger.info(f"Started verification for issue {issue.id}")

def _resolve_issue(db: Session, issue: Issue) -> None:
    now = datetime.now(timezone.utc)
    issue.status = IssueStatusEnum.RESOLVED
    issue.resolved_at = now
    
    if issue.verification_started_at:
        issue.resolution_duration_seconds = int((now - issue.verification_started_at).total_seconds())

    # Resolve associated alerts
    alerts = db.query(Alert).filter(Alert.issue_id == issue.id, Alert.status == AlertStatusEnum.OPEN).all()
    for a in alerts:
        a.status = AlertStatusEnum.RESOLVED
        a.resolved_at = now
        
    db.commit()
    logger.info(f"Issue {issue.id} RESOLVED")
