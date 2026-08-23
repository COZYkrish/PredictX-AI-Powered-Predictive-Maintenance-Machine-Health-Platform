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
