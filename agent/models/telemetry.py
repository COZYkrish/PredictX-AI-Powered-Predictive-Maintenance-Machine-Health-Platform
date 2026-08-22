from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

class PerformanceTelemetry(BaseModel):
    cpu_usage_percent: Optional[float] = None
    cpu_frequency_current_mhz: Optional[float] = None
    memory_percent: Optional[float] = None
    memory_used_bytes: Optional[int] = None
    memory_available_bytes: Optional[int] = None
    disk_usage_percent: Optional[float] = None
    disk_read_bytes_per_sec: Optional[float] = None
    disk_write_bytes_per_sec: Optional[float] = None
    disk_busy_percent: Optional[float] = None
    disk_latency_ms: Optional[float] = None
    network_upload_bytes_per_sec: Optional[float] = None
    network_download_bytes_per_sec: Optional[float] = None
    process_count: Optional[int] = None
    uptime_seconds: Optional[float] = None

class HealthTelemetry(BaseModel):
    cpu_temperature_c: Optional[float] = None
    gpu_temperature_c: Optional[float] = None
    gpu_usage_percent: Optional[float] = None
    gpu_memory_used_bytes: Optional[int] = None
    gpu_memory_total_bytes: Optional[int] = None
    battery_percent: Optional[float] = None
    storage_temperature_c: Optional[float] = None

class TelemetrySample(BaseModel):
    schema_version: str = "1.0"
    agent_version: str = "0.1.0"
    sample_id: str
    sequence_number: int
    timestamp_utc: datetime
    device_id: str
    collection_duration_ms: float
    
    performance: PerformanceTelemetry = Field(default_factory=PerformanceTelemetry)
    health: HealthTelemetry = Field(default_factory=HealthTelemetry)
