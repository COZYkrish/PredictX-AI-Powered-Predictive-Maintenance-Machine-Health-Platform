import logging
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from backend.schemas.telemetry import TelemetryBatchIn, TelemetryBatchResponse
from backend.repositories.telemetry import telemetry as telemetry_repo
from backend.repositories.prediction import prediction_job as prediction_job_repo
from backend.repositories.prediction import PredictionJobCreate
from backend.services.prediction_worker import process_prediction_job
from backend.services.resolution_service import evaluate_verifying_issues
from backend.db.session import SessionLocal

logger = logging.getLogger(__name__)

def background_process_job(job_id: str):
    db = SessionLocal()
    try:
        process_prediction_job(db, job_id)
    finally:
        db.close()

def process_telemetry_batch(
    db: Session, 
    batch: TelemetryBatchIn, 
    background_tasks: BackgroundTasks
) -> TelemetryBatchResponse:
    
    accepted = 0
    duplicates = 0
    invalid = 0
    prediction_triggered = 0
    
    for sample in batch.samples:
        try:
            # Idempotency check
            exists = telemetry_repo.get_by_sample_id(
                db, device_id=sample.device_id, sample_id=sample.sample_id
            )
            
            if exists:
                duplicates += 1
                continue
                
            # Store telemetry
            db_sample = telemetry_repo.create(db, obj_in=sample)
            accepted += 1

            # ── FIX: Update device presence on every accepted sample ──────────
            _update_device_presence(db, sample.device_id, db_sample.timestamp_utc)
            
            # Evaluate verification logic
            evaluate_verifying_issues(db, sample.device_id, db_sample)
            
            # Create Prediction Job
            job_in = PredictionJobCreate(
                device_id=sample.device_id,
                sample_id=sample.sample_id
            )
            job = prediction_job_repo.create(db, obj_in=job_in)
            
            # Dispatch background task
            background_tasks.add_task(background_process_job, job.id)
            prediction_triggered += 1
            
        except Exception as e:
            logger.error(f"Failed to process sample {sample.sample_id}: {e}")
            invalid += 1
            # We don't fail the whole batch, just this sample
            db.rollback() 
            
    return TelemetryBatchResponse(
        accepted=accepted,
        duplicates=duplicates,
        invalid=invalid,
        prediction_triggered=prediction_triggered
    )


def _update_device_presence(db: Session, device_id: str, timestamp_utc) -> None:
    """
    Update device.last_seen_at and is_online whenever valid telemetry arrives.
    This is the authoritative update — presence_status is derived from last_seen_at.
    """
    from backend.models.device import Device

    device = db.query(Device).filter(Device.device_id == device_id).first()
    if device is None:
        logger.warning(f"Received telemetry for unknown device_id={device_id}, skipping presence update.")
        return

    device.last_seen_at = timestamp_utc
    device.is_online = True  # Stamp online; presence_status property re-evaluates stale/offline

    try:
        db.commit()
    except Exception as e:
        logger.error(f"Failed to update device presence for {device_id}: {e}")
        db.rollback()
