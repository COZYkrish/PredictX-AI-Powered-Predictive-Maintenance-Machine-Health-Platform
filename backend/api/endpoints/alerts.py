from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.alert import AlertOut
from backend.repositories.alert import alert as alert_repo
from backend.security.deps import get_current_user
from backend.models.user import User

router = APIRouter()

@router.get("/", response_model=List[AlertOut])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Basic list implementation, would add pagination here
    return alert_repo.get_multi(db, limit=50)
