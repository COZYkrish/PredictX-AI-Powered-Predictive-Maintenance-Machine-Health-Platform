from typing import Dict, Any, Tuple
import os
import random
import logging
from backend.config import settings

logger = logging.getLogger(__name__)

class MLAdapter:
    def __init__(self):
        self.mode = settings.ML_MODE
        self.predictor = None
        self.anomaly_detector = None
        
        if self.mode == "real":
            try:
                # Lazy import to avoid loading heavy ML libs if not needed
                from ml.inference.predictor import Predictor, AnomalyDetector
                import joblib
                
                model_dir = os.path.join(os.path.dirname(__file__), "../../ml/artifacts/models")
                
                # Default paths based on phase 2 output
                predictor_path = os.path.join(model_dir, "predictor_latest.joblib")
                detector_path = os.path.join(model_dir, "anomaly_latest.joblib")
                
                if os.path.exists(predictor_path):
                    self.predictor = Predictor(model_path=predictor_path)
                
                if os.path.exists(detector_path):
                    self.anomaly_detector = AnomalyDetector(model_path=detector_path)
                
                logger.info(f"ML Adapter initialized in REAL mode.")
            except Exception as e:
                logger.error(f"Failed to load ML artifacts in real mode: {e}")
                logger.warning("Falling back to mock mode")
                self.mode = "mock"
        
        if self.mode == "mock":
            logger.info("ML Adapter initialized in MOCK mode.")

    def run_prediction(self, features: Dict[str, Any]) -> Tuple[Dict[str, Any], str, str]:
        """
        Runs ML prediction and returns (results, model_name, model_version)
        """
        if self.mode == "real" and self.predictor:
            import pandas as pd
            df = pd.DataFrame([features])
            
            # Predictor returns health score and classification
            health_score, classification, probs = self.predictor.predict(df)
            health = int(health_score[0])
            pred_class = classification[0]
            
            # Use max prob as confidence
            confidence = float(max(probs[0])) if probs is not None else 0.0
            
            # Risk mapping
            risk_level = "LOW"
            if pred_class == "Warning":
                risk_level = "MEDIUM"
            elif pred_class == "Critical":
                risk_level = "HIGH"
                
            results = {
                "prediction": pred_class.upper(),
                "prediction_probability": confidence,
                "risk_level": risk_level,
                "health_score": health
            }
            return results, self.predictor.model_name, self.predictor.model_version
            
        else:
            # Mock mode implementation
            # Deterministic mock based on CPU/RAM
            cpu = features.get("cpu_usage_percent", 50)
            mem = features.get("memory_percent", 50)
            
            if cpu > 90 or mem > 90:
                pred_class = "CRITICAL"
                risk_level = "HIGH"
                health = random.randint(10, 40)
                prob = random.uniform(0.8, 0.99)
            elif cpu > 70 or mem > 70:
                pred_class = "WARNING"
                risk_level = "MEDIUM"
                health = random.randint(40, 70)
                prob = random.uniform(0.6, 0.8)
            else:
                pred_class = "HEALTHY"
                risk_level = "LOW"
                health = random.randint(70, 100)
                prob = random.uniform(0.7, 0.95)
                
            results = {
                "prediction": pred_class,
                "prediction_probability": prob,
                "risk_level": risk_level,
                "health_score": health
            }
            return results, "mock_xgboost", "v1.0.0-mock"

ml_adapter = MLAdapter()
