from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.alert import AlertOut
from backend.repositories.alert import alert as alert_repo
from backend.security.deps import get_current_user
from backend.models.user import User

router = APIRouter()

@router.get("", response_model=List[AlertOut])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Basic list implementation, would add pagination here
    return alert_repo.get_multi(db, limit=50)

@router.get("/device/{device_id}", response_model=List[AlertOut])
def get_device_alerts(
    device_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    from backend.models.alert import Alert
    alerts = db.query(Alert).filter(Alert.device_id == device_id).order_by(Alert.created_at.desc()).limit(limit).all()
    return alerts
