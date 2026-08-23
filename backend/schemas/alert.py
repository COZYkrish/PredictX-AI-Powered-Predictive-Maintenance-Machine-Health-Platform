from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.alert import AlertStatusEnum, AlertSeverityEnum

class AlertOut(BaseModel):
    id: str
    device_id: str
    prediction_id: Optional[str] = None
    
    alert_type: str
    severity: AlertSeverityEnum
    title: str
    message: Optional[str] = None
    status: AlertStatusEnum
    
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
