from typing import Optional
from sqlalchemy.orm import Session
from backend.repositories.base import CRUDBase
from backend.models.alert import Alert, AlertStatusEnum
from backend.schemas.alert import AlertOut
from pydantic import BaseModel
import uuid
from datetime import datetime

class AlertCreate(BaseModel):
    device_id: str
    prediction_id: str | None = None
    alert_type: str
    severity: str
    title: str
    message: str | None = None

class AlertUpdate(BaseModel):
    status: AlertStatusEnum
    acknowledged_at: datetime | None = None
    resolved_at: datetime | None = None

class CRUDAlert(CRUDBase[Alert, AlertCreate, AlertUpdate]):
    def create(self, db: Session, *, obj_in: AlertCreate) -> Alert:
        db_obj = Alert(
            id=str(uuid.uuid4()),
            **obj_in.model_dump(exclude_unset=True)
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_active_for_device(self, db: Session, *, device_id: str, alert_type: str) -> Optional[Alert]:
        return db.query(Alert).filter(
            Alert.device_id == device_id,
            Alert.alert_type == alert_type,
            Alert.status == AlertStatusEnum.OPEN
        ).first()

alert = CRUDAlert(Alert)
