from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.maintenance import MaintenanceStatusEnum

class MaintenanceCreate(BaseModel):
    device_id: str
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[MaintenanceStatusEnum] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceOut(BaseModel):
    id: str
    device_id: str
    alert_id: Optional[str] = None
    
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    status: MaintenanceStatusEnum
    
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
