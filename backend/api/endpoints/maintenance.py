from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging

from backend.db.session import get_db
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.models.maintenance import MaintenanceRecord, MaintenanceStatusEnum

logger = logging.getLogger(__name__)
router = APIRouter()


class MaintenanceRecordCreate(BaseModel):
    device_id: str
    alert_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = "RECOMMENDED"
    scheduled_at: Optional[datetime] = None


class MaintenanceRecordUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    notes: Optional[str] = None


class MaintenanceRecordOut(BaseModel):
    id: str
    device_id: str
    alert_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    status: str
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


@router.get("/device/{device_id}", response_model=List[MaintenanceRecordOut])
def get_maintenance_records(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.device_id == device_id)
        .order_by(MaintenanceRecord.created_at.desc())
        .all()
    )
    return records


@router.post("/", response_model=MaintenanceRecordOut)
def create_maintenance_record(
    record_in: MaintenanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        status_enum = MaintenanceStatusEnum(record_in.status)
    except ValueError:
        status_enum = MaintenanceStatusEnum.RECOMMENDED

    new_record = MaintenanceRecord(
        id=str(uuid.uuid4()),
        device_id=record_in.device_id,
        alert_id=record_in.alert_id,
        title=record_in.title,
        description=record_in.description,
        priority=record_in.priority,
        status=status_enum,
        scheduled_at=record_in.scheduled_at,
        created_by=current_user.id
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.patch("/{record_id}", response_model=MaintenanceRecordOut)
def update_maintenance_record(
    record_id: str,
    record_in: MaintenanceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    if record_in.status is not None:
        try:
            record.status = MaintenanceStatusEnum(record_in.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    if record_in.started_at is not None:
        record.started_at = record_in.started_at
    if record_in.completed_at is not None:
        record.completed_at = record_in.completed_at
    if record_in.estimated_cost is not None:
        record.estimated_cost = record_in.estimated_cost
    if record_in.actual_cost is not None:
        record.actual_cost = record_in.actual_cost
    if record_in.notes is not None:
        record.notes = record_in.notes

    db.commit()
    db.refresh(record)
    return record
