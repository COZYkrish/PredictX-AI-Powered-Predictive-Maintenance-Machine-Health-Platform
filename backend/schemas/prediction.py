from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.prediction_job import JobStatusEnum

class PredictionJobOut(BaseModel):
    id: str
    device_id: str
    sample_id: str
    status: JobStatusEnum
    error_message: Optional[str] = None
    requested_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class PredictionOut(BaseModel):
    id: str
    device_id: str
    sample_id: str
    timestamp_utc: datetime
    
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    
    prediction: Optional[str] = None
    prediction_probability: Optional[float] = None
    risk_level: Optional[str] = None
    health_score: Optional[int] = None
    
    anomaly_label: Optional[str] = None
    anomaly_score: Optional[float] = None
    
    created_at: datetime
    
    model_config = {"from_attributes": True}

class PredictionRequest(BaseModel):
    device_id: str
    sample_id: Optional[str] = None
