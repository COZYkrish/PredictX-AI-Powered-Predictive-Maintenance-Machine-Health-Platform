from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from backend.db.base import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True, nullable=False)
    sample_id = Column(String, index=True, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), index=True, nullable=False)
    
    model_name = Column(String)
    model_version = Column(String)
    schema_version = Column(String)
    feature_version = Column(String)
    label_schema_version = Column(String)
    
    prediction = Column(String) # e.g. "WARNING"
    prediction_probability = Column(Float)
    risk_level = Column(String)
    health_score = Column(Integer)
    
    anomaly_label = Column(String)
    anomaly_score = Column(Float)
    
    inference_duration_ms = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('ix_predictions_device_timestamp', 'device_id', 'timestamp_utc'),
    )
