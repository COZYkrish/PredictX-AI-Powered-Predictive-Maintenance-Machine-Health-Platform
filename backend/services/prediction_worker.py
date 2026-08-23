import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.repositories.prediction import prediction_job as prediction_job_repo
from backend.repositories.prediction import prediction as prediction_repo
from backend.repositories.telemetry import telemetry as telemetry_repo
from backend.repositories.device import device as device_repo
from backend.repositories.prediction import PredictionCreate
from backend.ml.adapter import ml_adapter
# Import alert service later in function to avoid circular imports if needed

logger = logging.getLogger(__name__)

def process_prediction_job(db: Session, job_id: str):
    """
    Background worker function that runs ML inference for a pending prediction job.
    """
    job = prediction_job_repo.get(db, id=job_id)
    if not job:
        logger.error(f"Job {job_id} not found")
        return
        
    if job.status != "PENDING":
        logger.warning(f"Job {job_id} already processing/completed. Status: {job.status}")
        return
        
    # Mark PROCESSING
    job.status = "PROCESSING"
    job.started_at = datetime.now(timezone.utc)
    db.commit()
    
    try:
        # Fetch telemetry
        telemetry_sample = telemetry_repo.get_by_sample_id(
            db, device_id=job.device_id, sample_id=job.sample_id
        )
        
        # We need the actual data to run prediction. Wait, get_by_sample_id in repository 
        # returned a boolean? Let me fix that. Actually I wrote:
        # return db.query(TelemetrySample).filter(...).first() is not None
        # Let's get the object directly.
        telemetry_obj = db.query(telemetry_repo.model).filter(
            telemetry_repo.model.device_id == job.device_id,
            telemetry_repo.model.sample_id == job.sample_id
        ).first()
        
        if not telemetry_obj:
            raise ValueError(f"Telemetry {job.sample_id} not found for device {job.device_id}")
            
        features = {c.name: getattr(telemetry_obj, c.name) for c in telemetry_obj.__table__.columns}
        
        # Run ML
        start_time = datetime.now()
        results, model_name, model_version = ml_adapter.run_prediction(features)
        inference_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Save prediction
        pred_in = PredictionCreate(
            device_id=job.device_id,
            sample_id=job.sample_id,
            timestamp_utc=telemetry_obj.timestamp_utc,
            model_name=model_name,
            model_version=model_version,
            prediction=results["prediction"],
            prediction_probability=results["prediction_probability"],
            risk_level=results["risk_level"],
            health_score=results["health_score"]
        )
        
        prediction = prediction_repo.create(db, obj_in=pred_in)
        prediction.inference_duration_ms = inference_time_ms
        db.commit()
        
        # Update job
        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        job.model_name = model_name
        job.model_version = model_version
        db.commit()
        
        # Trigger alert evaluation
        from backend.services.alert_service import evaluate_prediction_for_alerts
        evaluate_prediction_for_alerts(db, prediction)
        
        # Broadcast via WebSockets
        from backend.realtime.manager import realtime_manager
        realtime_manager.broadcast_prediction(prediction)
        
    except Exception as e:
        logger.exception(f"Error processing prediction job {job_id}")
        job.status = "FAILED"
        job.error_message = str(e)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
