from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.device_capability import CapabilityStatusEnum

class DeviceCreate(BaseModel):
    device_id: str
    hostname: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    operating_system: Optional[str] = None
    os_version: Optional[str] = None
    architecture: Optional[str] = None
    agent_version: Optional[str] = None
    schema_version: Optional[str] = None

class DeviceUpdate(BaseModel):
    display_name: Optional[str] = None
    is_active: Optional[bool] = None
    hostname: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    operating_system: Optional[str] = None
    os_version: Optional[str] = None
    architecture: Optional[str] = None

class DeviceOut(DeviceCreate):
    id: str
    display_name: Optional[str] = None
    first_seen_at: datetime
    last_seen_at: Optional[datetime] = None
    is_online: bool
    is_active: bool
    status: str
    
    model_config = {"from_attributes": True}

class CapabilityOut(BaseModel):
    metric_name: str
    category: Optional[str] = None
    status: CapabilityStatusEnum
    reason: Optional[str] = None
    last_checked_at: datetime
    
    model_config = {"from_attributes": True}
