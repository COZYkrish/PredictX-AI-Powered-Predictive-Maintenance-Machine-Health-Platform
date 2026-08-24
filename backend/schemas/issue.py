from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IssueBase(BaseModel):
    device_id: str
    issue_type: str
    condition_band: str
    severity: str
    status: str
    current_value: Optional[float] = None
    threshold: Optional[float] = None
    duration_seconds: Optional[int] = None
    baseline_value: Optional[float] = None
    explanation: Optional[str] = None
    likely_causes: Optional[List[str]] = None
    evidence_level: Optional[str] = None
    recommendation: Optional[str] = None
    verification_target: Optional[float] = None
    verification_metric: Optional[str] = None
    verification_operator: Optional[str] = None
    verification_duration_seconds: Optional[int] = None
    source_type: str
    source_id: str

class IssueOut(IssueBase):
    id: str
    detected_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    verification_started_at: Optional[datetime] = None
    verification_attempts: Optional[int] = None
    resolution_duration_seconds: Optional[int] = None
    
    model_config = {"from_attributes": True}

class IssueAction(BaseModel):
    action: str # "VERIFY" | "DISMISS" | "ACKNOWLEDGE"
