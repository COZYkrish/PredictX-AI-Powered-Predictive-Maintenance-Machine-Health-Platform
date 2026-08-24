from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.sql import func
import enum
from backend.db.base import Base

class IssueStatusEnum(str, enum.Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    VERIFYING = "VERIFYING"
    PERSISTING = "PERSISTING"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"
    DISMISSED = "DISMISSED"

class IssueSeverityEnum(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class EvidenceLevelEnum(str, enum.Enum):
    CONFIRMED_BY_TELEMETRY = "CONFIRMED_BY_TELEMETRY"
    SUPPORTED = "SUPPORTED"
    POSSIBLE = "POSSIBLE"
    UNKNOWN = "UNKNOWN"

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    
    issue_type = Column(String, nullable=False)
    condition_band = Column(String)  # Optional grouping e.g., 'HIGH', 'WARNING'
    severity = Column(SQLEnum(IssueSeverityEnum), nullable=False)
    status = Column(SQLEnum(IssueStatusEnum), default=IssueStatusEnum.DETECTED, nullable=False, index=True)

    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    current_value = Column(Float)
    baseline_value = Column(Float)
    threshold = Column(Float)
    duration_seconds = Column(Integer)
    
    # Verification details
    verification_metric = Column(String)
    verification_operator = Column(String)
    verification_target = Column(Float)
    verification_duration_seconds = Column(Integer)
    verification_required_consecutive_samples = Column(Integer)
    
    verification_attempts = Column(Integer, default=0)
    last_verification_at = Column(DateTime(timezone=True))
    verification_started_at = Column(DateTime(timezone=True))
    
    resolution_duration_seconds = Column(Integer)

    # Descriptive fields
    explanation = Column(String)
    likely_causes = Column(JSON) # JSON array of strings
    recommendation = Column(String)
    
    evidence_level = Column(SQLEnum(EvidenceLevelEnum), default=EvidenceLevelEnum.UNKNOWN)
    
    # Provenance
    source_type = Column(String)
    source_id = Column(String)
    
    prediction_id = Column(String, ForeignKey("predictions.id"))
    anomaly_score = Column(Float)
    
    model_name = Column(String)
    model_version = Column(String)
