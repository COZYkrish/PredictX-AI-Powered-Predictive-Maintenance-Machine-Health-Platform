import logging
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from backend.schemas.telemetry import TelemetryBatchIn, TelemetryBatchResponse
from backend.repositories.telemetry import telemetry as telemetry_repo
from backend.repositories.prediction import prediction_job as prediction_job_repo
from backend.repositories.prediction import PredictionJobCreate
from backend.services.prediction_worker import process_prediction_job
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
            telemetry_repo.create(db, obj_in=sample)
            accepted += 1
            
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
