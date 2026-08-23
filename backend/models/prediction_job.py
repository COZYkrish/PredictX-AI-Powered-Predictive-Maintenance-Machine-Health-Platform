from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from backend.db.base import Base

class JobStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class PredictionJob(Base):
    __tablename__ = "prediction_jobs"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    sample_id = Column(String, index=True, nullable=False)
    status = Column(SQLEnum(JobStatusEnum), default=JobStatusEnum.PENDING, nullable=False)
    
    model_name = Column(String)
    model_version = Column(String)
    error_message = Column(String)
    
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
