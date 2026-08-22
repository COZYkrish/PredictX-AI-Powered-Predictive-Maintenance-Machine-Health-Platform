import joblib
import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """Loads an Isolation Forest pipeline to detect anomalies."""
    
    def __init__(self, model_path: str):
        self.pipeline = joblib.load(model_path)
        logger.info(f"Loaded anomaly detector from {model_path}")
        
    def detect(self, sample: dict) -> dict:
        df = pd.DataFrame([sample])
        return self.detect_batch(df)[0]
        
    def detect_batch(self, df: pd.DataFrame) -> list:
        if df.empty:
            return []
            
        predictions = self.pipeline.predict(df) # 1 = inlier, -1 = outlier
        scores = self.pipeline.decision_function(df)
        
        results = []
        for p, s in zip(predictions, scores):
            results.append({
                "anomaly_label": "YES" if p == -1 else "NO",
                "anomaly_score": float(s) # lower = more anomalous
            })
        return results
