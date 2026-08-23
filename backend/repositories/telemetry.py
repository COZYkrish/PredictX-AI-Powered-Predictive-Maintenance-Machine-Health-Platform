from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.repositories.base import CRUDBase
from backend.models.telemetry import TelemetrySample
from backend.schemas.telemetry import TelemetryIn
import uuid

class CRUDTelemetry(CRUDBase[TelemetrySample, TelemetryIn, TelemetryIn]):
    def get_by_sample_id(self, db: Session, *, device_id: str, sample_id: str) -> bool:
        return db.query(TelemetrySample).filter(
            TelemetrySample.device_id == device_id,
            TelemetrySample.sample_id == sample_id
        ).first() is not None

    def create(self, db: Session, *, obj_in: TelemetryIn) -> TelemetrySample:
        obj_in_data = obj_in.model_dump(exclude_unset=True)
        db_obj = TelemetrySample(
            id=str(uuid.uuid4()),
            **obj_in_data
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_device(
        self, db: Session, *, device_id: str, skip: int = 0, limit: int = 100
    ) -> Tuple[List[TelemetrySample], int]:
        query = db.query(TelemetrySample).filter(TelemetrySample.device_id == device_id).order_by(TelemetrySample.timestamp_utc.desc())
        total = query.count()
        samples = query.offset(skip).limit(limit).all()
        return samples, total

telemetry = CRUDTelemetry(TelemetrySample)
