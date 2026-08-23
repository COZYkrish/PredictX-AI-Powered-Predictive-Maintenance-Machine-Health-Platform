from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.sql import func
import enum
from backend.db.base import Base

class AlertStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"
    
class AlertSeverityEnum(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    prediction_id = Column(String, ForeignKey("predictions.id"))
    
    alert_type = Column(String, nullable=False)
    severity = Column(SQLEnum(AlertSeverityEnum), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String)
    status = Column(SQLEnum(AlertStatusEnum), default=AlertStatusEnum.OPEN, nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    
    acknowledged_by = Column(String, ForeignKey("users.id"))
    resolved_by = Column(String, ForeignKey("users.id"))
