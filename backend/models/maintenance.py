from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from backend.db.base import Base

class MaintenanceStatusEnum(str, enum.Enum):
    RECOMMENDED = "RECOMMENDED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    issue_id = Column(String, ForeignKey("issues.id"), index=True, nullable=True)
    alert_id = Column(String, ForeignKey("alerts.id"))
    
    title = Column(String, nullable=False)
    description = Column(String)
    priority = Column(String)
    status = Column(SQLEnum(MaintenanceStatusEnum), default=MaintenanceStatusEnum.RECOMMENDED, nullable=False)
    
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    estimated_cost = Column(Float)
    actual_cost = Column(Float)
    notes = Column(String)
    
    created_by = Column(String, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
