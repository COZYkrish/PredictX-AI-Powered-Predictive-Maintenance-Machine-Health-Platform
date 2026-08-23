from typing import List, Tuple
from sqlalchemy.orm import Session
from backend.repositories.base import CRUDBase
from backend.models.prediction_job import PredictionJob, JobStatusEnum
from backend.models.prediction import Prediction
from pydantic import BaseModel
import uuid
from datetime import datetime

class PredictionJobCreate(BaseModel):
    device_id: str
    sample_id: str

class PredictionJobUpdate(BaseModel):
    status: JobStatusEnum
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    model_name: str | None = None
    model_version: str | None = None

class PredictionCreate(BaseModel):
    device_id: str
    sample_id: str
    timestamp_utc: datetime
    model_name: str | None = None
    model_version: str | None = None
    prediction: str | None = None
    prediction_probability: float | None = None
    risk_level: str | None = None
    health_score: int | None = None

class CRUDPredictionJob(CRUDBase[PredictionJob, PredictionJobCreate, PredictionJobUpdate]):
    def create(self, db: Session, *, obj_in: PredictionJobCreate) -> PredictionJob:
        db_obj = PredictionJob(
            id=str(uuid.uuid4()),
            device_id=obj_in.device_id,
            sample_id=obj_in.sample_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

class CRUDPrediction(CRUDBase[Prediction, PredictionCreate, PredictionCreate]):
    def create(self, db: Session, *, obj_in: PredictionCreate) -> Prediction:
        db_obj = Prediction(
            id=str(uuid.uuid4()),
            **obj_in.model_dump(exclude_unset=True)
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

prediction_job = CRUDPredictionJob(PredictionJob)
prediction = CRUDPrediction(Prediction)
