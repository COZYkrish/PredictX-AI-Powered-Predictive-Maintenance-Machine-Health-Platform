from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.sql import func
from backend.db.base import Base

class TelemetrySample(Base):
    __tablename__ = "telemetry_samples"

    id = Column(String, primary_key=True, index=True)
    sample_id = Column(String, index=True, nullable=False)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), index=True, nullable=False)
    sequence_number = Column(Integer)
    schema_version = Column(String)
    agent_version = Column(String)
    collection_duration_ms = Column(Integer)
    
    cpu_usage_percent = Column(Float)
    cpu_frequency_current_mhz = Column(Float)
    
    memory_percent = Column(Float)
    memory_used_bytes = Column(Float)
    memory_available_bytes = Column(Float)
    swap_percent = Column(Float)
    
    disk_usage_percent = Column(Float)
    disk_read_bytes_per_sec = Column(Float)
    disk_write_bytes_per_sec = Column(Float)
    disk_busy_percent = Column(Float)
    disk_latency_ms = Column(Float)
    
    network_upload_bytes_per_sec = Column(Float)
    network_download_bytes_per_sec = Column(Float)
    
    battery_percent = Column(Float)
    battery_plugged = Column(Boolean)
    battery_time_left_seconds = Column(Float)
    
    gpu_usage_percent = Column(Float)
    gpu_memory_used_bytes = Column(Float)
    gpu_memory_total_bytes = Column(Float)
    gpu_temperature_c = Column(Float)
    
    cpu_temperature_c = Column(Float)
    storage_temperature_c = Column(Float)
    
    process_count = Column(Integer)
    uptime_seconds = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('ix_telemetry_device_timestamp', 'device_id', 'timestamp_utc'),
        UniqueConstraint('device_id', 'sample_id', name='uq_telemetry_device_sample'),
    )
