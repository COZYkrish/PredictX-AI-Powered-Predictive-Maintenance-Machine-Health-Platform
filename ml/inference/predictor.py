import joblib
import pandas as pd
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class Predictor:
    """Loads a supervised trained model pipeline and makes predictions."""
    
    def __init__(self, model_path: str):
        self.pipeline = joblib.load(model_path)
        logger.info(f"Loaded predictor from {model_path}")
        
    def predict(self, sample: dict) -> dict:
        """Predicts risk for a single sample."""
        df = pd.DataFrame([sample])
        return self.predict_batch(df)[0]
        
    def predict_batch(self, df: pd.DataFrame) -> list:
        """Predicts risk for a batch of samples."""
        if df.empty:
            return []
            
        predictions = self.pipeline.predict(df)
        
        if hasattr(self.pipeline.steps[-1][1], "predict_proba"):
            probabilities = self.pipeline.predict_proba(df)
            prob_max = probabilities.max(axis=1)
        else:
            prob_max = [1.0] * len(predictions)
            
        results = []
        for p, prob in zip(predictions, prob_max):
            risk_level = self._map_risk(p, prob)
            results.append({
                "prediction": int(p),
                "probability": float(prob),
                "risk_level": risk_level
            })
        return results
        
    def _map_risk(self, prediction: int, probability: float) -> str:
        # Simple mapping assuming 0=Healthy, 1=Warning, 2=Critical
        if prediction == 0:
            return "LOW"
        elif prediction == 1:
            return "MEDIUM" if probability < 0.8 else "HIGH"
        else:
            return "CRITICAL"
