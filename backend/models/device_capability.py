from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from backend.db.base import Base

class CapabilityStatusEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"
    ERROR = "ERROR"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class DeviceCapability(Base):
    __tablename__ = "device_capabilities"
    
    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    metric_name = Column(String, nullable=False)
    category = Column(String)
    available = Column(String) # usually mapped from status, keeping for schema compatibility
    status = Column(SQLEnum(CapabilityStatusEnum), default=CapabilityStatusEnum.NOT_APPLICABLE, nullable=False)
    source = Column(String)
    reason = Column(String)
    collector_version = Column(String)
    
    last_checked_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
