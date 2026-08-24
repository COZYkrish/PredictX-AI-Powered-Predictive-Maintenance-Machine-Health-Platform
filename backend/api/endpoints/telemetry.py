from typing import Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.telemetry import TelemetryBatchIn, TelemetryBatchResponse
from backend.services.telemetry_service import process_telemetry_batch
# We'd typically inject a rate limiter here, but we will attach it to the app or router in main.py

router = APIRouter()

@router.post("/batch", response_model=TelemetryBatchResponse)
def upload_telemetry_batch(
    *,
    db: Session = Depends(get_db),
    batch_in: TelemetryBatchIn,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Idempotent batch upload of telemetry data.
    """
    return process_telemetry_batch(db, batch_in, background_tasks)

@router.get("/device/{device_id}", response_model=list[Any])
def get_device_telemetry(
    device_id: str,
    limit: int = 1,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get latest telemetry for a device.
    """
    from backend.models.telemetry import TelemetrySample
    records = db.query(TelemetrySample).filter(TelemetrySample.device_id == device_id).order_by(TelemetrySample.timestamp_utc.desc()).limit(limit).all()
    
    # Map to frontend expected format
    result = []
    for r in records:
        result.append({
            "cpu_percent": r.cpu_usage_percent,
            "cpu_freq_current": r.cpu_frequency_current_mhz,
            "memory_percent": r.memory_percent,
            "memory_used": r.memory_used_bytes,
            "memory_total": (r.memory_used_bytes + r.memory_available_bytes) if r.memory_used_bytes and r.memory_available_bytes else None,
            "disk_percent": r.disk_usage_percent,
            "disk_used": None, # Agent might not send disk_used directly
            "disk_total": None,
            "system_uptime": r.uptime_seconds,
            "timestamp": r.timestamp_utc
        })
    return result
