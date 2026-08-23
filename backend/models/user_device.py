from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from backend.db.base import Base

class AccessRoleEnum(str, enum.Enum):
    OWNER = "OWNER"
    ENGINEER = "ENGINEER"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"

class UserDevice(Base):
    __tablename__ = "user_devices"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    device_id = Column(String, ForeignKey("devices.id"), index=True, nullable=False)
    access_role = Column(SQLEnum(AccessRoleEnum), default=AccessRoleEnum.VIEWER, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
