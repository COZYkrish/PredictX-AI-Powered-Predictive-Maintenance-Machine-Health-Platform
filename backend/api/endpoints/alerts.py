from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.alert import AlertOut
from backend.models.alert import Alert, AlertStatusEnum
from backend.security.deps import get_current_user
from backend.models.user import User

router = APIRouter()


@router.get("", response_model=List[AlertOut])
def get_alerts(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    status: Optional[str] = Query(None, description="Filter by status: OPEN, RESOLVED, ACKNOWLEDGED, DISMISSED"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    List alerts. Always filter by device_id to prevent cross-device leakage.
    Results are ordered newest first.
    """
    query = db.query(Alert)

    if device_id:
        query = query.filter(Alert.device_id == device_id)

    if status:
        try:
            query = query.filter(Alert.status == AlertStatusEnum(status))
        except ValueError:
            pass  # Invalid status — ignore filter, return all

    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.get("/device/{device_id}", response_model=List[AlertOut])
def get_device_alerts(
    device_id: str,
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Convenience route: alerts for a specific device, newest first."""
    query = db.query(Alert).filter(Alert.device_id == device_id)

    if status:
        try:
            query = query.filter(Alert.status == AlertStatusEnum(status))
        except ValueError:
            pass

    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.get("/device/{device_id}/debug")
def get_device_alert_debug(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Admin debug endpoint: full alert + issue count trace for a device.
    Returns raw counts from DB so mismatches between frontend and backend are obvious.
    """
    from backend.models.user import RoleEnum
    from backend.models.issue import Issue, IssueStatusEnum
    from sqlalchemy import func

    if current_user.role not in (RoleEnum.ADMIN, RoleEnum.ENGINEER):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin/Engineer access required")

    _ACTIVE_STATUSES = [
        IssueStatusEnum.DETECTED,
        IssueStatusEnum.INVESTIGATING,
        IssueStatusEnum.ACTION_REQUIRED,
        IssueStatusEnum.VERIFYING,
        IssueStatusEnum.PERSISTING,
        IssueStatusEnum.ESCALATED,
    ]

    total_issues = db.query(func.count(Issue.id)).filter(Issue.device_id == device_id).scalar()
    active_issues = (
        db.query(Issue)
        .filter(Issue.device_id == device_id, Issue.status.in_(_ACTIVE_STATUSES))
        .order_by(Issue.detected_at.desc())
        .all()
    )

    total_alerts = db.query(func.count(Alert.id)).filter(Alert.device_id == device_id).scalar()
    open_alerts = (
        db.query(Alert)
        .filter(Alert.device_id == device_id, Alert.status == AlertStatusEnum.OPEN)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return {
        "device_id": device_id,
        "issue_count": total_issues,
        "active_issue_count": len(active_issues),
        "alert_count": total_alerts,
        "open_alert_count": len(open_alerts),
        "active_issues": [
            {
                "id": i.id,
                "issue_type": i.issue_type,
                "severity": i.severity.value if hasattr(i.severity, "value") else i.severity,
                "status": i.status.value if hasattr(i.status, "value") else i.status,
                "current_value": i.current_value,
                "detected_at": i.detected_at.isoformat() if i.detected_at else None,
            }
            for i in active_issues
        ],
        "open_alerts": [
            {
                "id": a.id,
                "issue_id": a.issue_id,
                "alert_type": a.alert_type,
                "severity": a.severity.value if hasattr(a.severity, "value") else a.severity,
                "title": a.title,
                "status": a.status.value if hasattr(a.status, "value") else a.status,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in open_alerts
        ],
    }
