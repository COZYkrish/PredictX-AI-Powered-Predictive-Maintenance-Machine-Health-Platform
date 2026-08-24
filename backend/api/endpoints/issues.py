from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.issue import IssueOut, IssueAction
from backend.models.issue import Issue, IssueStatusEnum
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.services.resolution_service import start_verification

router = APIRouter()

@router.get("", response_model=List[IssueOut])
def get_issues(
    device_id: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = db.query(Issue)
    if device_id:
        query = query.filter(Issue.device_id == device_id)
    if status:
        query = query.filter(Issue.status == IssueStatusEnum(status))
    return query.order_by(Issue.detected_at.desc()).all()

@router.get("/{issue_id}", response_model=IssueOut)
def get_issue(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.post("/{issue_id}/action", response_model=IssueOut)
def action_issue(
    issue_id: str,
    action_in: IssueAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if action_in.action == "VERIFY":
        start_verification(db, issue)
    elif action_in.action == "DISMISS":
        issue.status = IssueStatusEnum.DISMISSED
        db.commit()
        db.refresh(issue)
        
    return issue
