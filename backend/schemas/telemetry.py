from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TelemetryIn(BaseModel):
    sample_id: str
    device_id: str
    timestamp_utc: datetime
    sequence_number: Optional[int] = None
    schema_version: Optional[str] = None
    agent_version: Optional[str] = None
    collection_duration_ms: Optional[int] = None
    
    cpu_usage_percent: Optional[float] = Field(None, ge=0, le=100)
    cpu_frequency_current_mhz: Optional[float] = None
    
    memory_percent: Optional[float] = Field(None, ge=0, le=100)
    memory_used_bytes: Optional[float] = None
    memory_available_bytes: Optional[float] = None
    swap_percent: Optional[float] = Field(None, ge=0, le=100)
    
    disk_usage_percent: Optional[float] = Field(None, ge=0, le=100)
    disk_read_bytes_per_sec: Optional[float] = None
    disk_write_bytes_per_sec: Optional[float] = None
    disk_busy_percent: Optional[float] = Field(None, ge=0, le=100)
    disk_latency_ms: Optional[float] = None
    
    network_upload_bytes_per_sec: Optional[float] = None
    network_download_bytes_per_sec: Optional[float] = None
    
    battery_percent: Optional[float] = Field(None, ge=0, le=100)
    battery_plugged: Optional[bool] = None
    battery_time_left_seconds: Optional[float] = None
    
    gpu_usage_percent: Optional[float] = Field(None, ge=0, le=100)
    gpu_memory_used_bytes: Optional[float] = None
    gpu_memory_total_bytes: Optional[float] = None
    gpu_temperature_c: Optional[float] = None
    
    cpu_temperature_c: Optional[float] = None
    storage_temperature_c: Optional[float] = None
    
    process_count: Optional[int] = None
    uptime_seconds: Optional[float] = None

class TelemetryBatchIn(BaseModel):
    samples: List[TelemetryIn]

class TelemetryBatchResponse(BaseModel):
    accepted: int
    duplicates: int
    invalid: int
    prediction_triggered: int

class TelemetryOut(TelemetryIn):
    id: str
    created_at: datetime
    
    model_config = {"from_attributes": True}
