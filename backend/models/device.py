from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.sql import func
from backend.db.base import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    hostname = Column(String)
    display_name = Column(String)
    manufacturer = Column(String)
    model = Column(String)
    operating_system = Column(String)
    os_version = Column(String)
    architecture = Column(String)
    agent_version = Column(String)
    schema_version = Column(String)
    
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True))
    is_online = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True) # Soft delete
    
    status = Column(String, default="ACTIVE")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
