from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.db.session import get_db
from backend.repositories.prediction import prediction_job as job_repo, prediction as pred_repo
from backend.repositories.prediction import PredictionJobCreate
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.models.prediction import Prediction
from backend.services.telemetry_service import background_process_job
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class PredictionOut(BaseModel):
    id: str
    device_id: str
    sample_id: Optional[str] = None
    timestamp_utc: Any
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    prediction: Optional[str] = None
    prediction_probability: Optional[float] = None
    risk_level: Optional[str] = None
    health_score: Optional[int] = None
    anomaly_label: Optional[str] = None
    anomaly_score: Optional[float] = None
    inference_duration_ms: Optional[int] = None
    created_at: Any

    model_config = {"from_attributes": True}


class PredictionJobOut(BaseModel):
    id: str
    device_id: str
    sample_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    created_at: Any
    started_at: Optional[Any] = None
    completed_at: Optional[Any] = None

    model_config = {"from_attributes": True}


@router.get("/jobs/{job_id}", response_model=PredictionJobOut)
def get_prediction_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    job = job_repo.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/device/{device_id}", response_model=List[PredictionOut])
def get_device_predictions(
    device_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get recent predictions for a device, most recent first."""
    preds = (
        db.query(Prediction)
        .filter(Prediction.device_id == device_id)
        .order_by(Prediction.timestamp_utc.desc())
        .limit(limit)
        .all()
    )
    return preds


@router.post("/device/{device_id}", response_model=PredictionJobOut)
def trigger_device_prediction(
    device_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Trigger an on-demand ML prediction for a device.
    Creates a prediction job and runs it in the background.
    Returns the job immediately so the frontend can poll its status.
    """
    # Use a synthetic sample_id for on-demand predictions
    sample_id = f"on-demand-{uuid.uuid4()}"

    job_in = PredictionJobCreate(device_id=device_id, sample_id=sample_id)
    job = job_repo.create(db, obj_in=job_in)

    background_tasks.add_task(background_process_job, job.id)
    logger.info(f"On-demand prediction job {job.id} created for device {device_id}")
    return job
