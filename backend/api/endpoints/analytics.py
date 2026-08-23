from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.analytics import AnalyticsOverview
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.repositories.device import device as device_repo
from backend.repositories.alert import alert as alert_repo

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Very basic mock logic for Phase 3 initially, could pull from DB
    return AnalyticsOverview(
        total_devices=device_repo.count(db),
        online_devices=0,
        offline_devices=device_repo.count(db),
        healthy_devices=device_repo.count(db),
        warning_devices=0,
        critical_devices=0,
        active_alerts=alert_repo.count(db),
        average_system_health=100.0
    )
