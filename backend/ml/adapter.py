"""
ML Adapter — bridges backend prediction requests to the Phase 2 ML engine.

The adapter loads the versioned XGBoost + Isolation Forest artifacts directly.
It does NOT silently fall back to mock predictions. If ML_MODE=real and models
fail to load, prediction requests will raise an explicit error.

To use mock mode for testing, set ML_MODE=mock in .env.
"""
from typing import Dict, Any, Optional, Tuple
import os
import json
import logging
from pathlib import Path
from backend.config import settings

logger = logging.getLogger(__name__)

# ── Artifact paths ────────────────────────────────────────────────────────────
_MODELS_DIR = Path(__file__).parent.parent.parent / "ml" / "artifacts" / "models"
_METADATA_PATH = _MODELS_DIR / "metadata.json"

# Versioned filenames — must match what trainer.py produced
_PREDICTOR_FILENAME = "system_health_xgboost_v1.0.0.joblib"
_ANOMALY_FILENAME = "anomaly_isolation_forest_v1.0.0.joblib"


def _load_metadata() -> Optional[dict]:
    try:
        with open(_METADATA_PATH) as f:
            raw = f.read()
        # metadata.json may contain NaN (invalid JSON) from sklearn metrics
        import re
        raw = re.sub(r'\bNaN\b', 'null', raw)
        return json.loads(raw)
    except Exception as e:
        logger.error(f"Failed to load model metadata: {e}")
        return None


class MLAdapter:
    """
    Loads real ML artifacts and exposes a unified prediction interface.

    Status attributes:
        model_status : "READY" | "UNAVAILABLE" | "MOCK"
        anomaly_status : "READY" | "UNAVAILABLE" | "MOCK"
        model_name / model_version / feature_version : from metadata
        load_error : description if loading failed
    """

    def __init__(self):
        self.mode = settings.ML_MODE            # "real" | "mock"
        self.pipeline = None                    # XGBoost sklearn Pipeline
        self.anomaly_pipeline = None            # Isolation Forest sklearn Pipeline
        self.model_status = "UNAVAILABLE"
        self.anomaly_status = "UNAVAILABLE"
        self.model_name = "system_health_xgboost"
        self.model_version = "v1.0.0"
        self.feature_version = "1.0"
        self.expected_features: list = []
        self.load_error: Optional[str] = None

        # Load metadata regardless of mode (for reporting)
        meta = _load_metadata()
        if meta:
            self.model_name = meta.get("model_name", "system_health_xgboost")
            self.model_version = meta.get("model_version", "v1.0.0")
            self.feature_version = meta.get("feature_version", "1.0")
            self.expected_features = meta.get("features", [])

        if self.mode == "real":
            self._load_real_models()
        else:
            logger.warning("ML Adapter running in MOCK mode (ML_MODE=mock). "
                           "Set ML_MODE=real to use trained models.")
            self.model_status = "MOCK"
            self.anomaly_status = "MOCK"

    def _load_real_models(self):
        import joblib

        # ── XGBoost ──────────────────────────────────────────────────────────
        predictor_path = _MODELS_DIR / _PREDICTOR_FILENAME
        if predictor_path.exists():
            try:
                self.pipeline = joblib.load(predictor_path)
                self.model_status = "READY"
                logger.info(f"XGBoost model loaded: {predictor_path}")
            except Exception as e:
                self.load_error = f"XGBoost load failed: {e}"
                self.model_status = "UNAVAILABLE"
                logger.error(self.load_error)
        else:
            self.load_error = f"Artifact not found: {predictor_path}"
            self.model_status = "UNAVAILABLE"
            logger.error(self.load_error)

        # ── Isolation Forest ─────────────────────────────────────────────────
        anomaly_path = _MODELS_DIR / _ANOMALY_FILENAME
        if anomaly_path.exists():
            try:
                self.anomaly_pipeline = joblib.load(anomaly_path)
                self.anomaly_status = "READY"
                logger.info(f"Isolation Forest loaded: {anomaly_path}")
            except Exception as e:
                logger.error(f"Anomaly model load failed: {e}")
                self.anomaly_status = "UNAVAILABLE"
        else:
            logger.warning(f"Anomaly artifact not found: {anomaly_path}")
            self.anomaly_status = "UNAVAILABLE"

    # ─────────────────────────────────────────────────────────────────────────

    def run_prediction(
        self, feature_df
    ) -> Tuple[Dict[str, Any], str, str]:
        """
        Run ML inference on a prepared feature DataFrame.

        Returns:
            (results_dict, model_name, model_version)

        Raises:
            RuntimeError if mode=real and model is unavailable.
        """
        import pandas as pd

        if not isinstance(feature_df, pd.DataFrame):
            feature_df = pd.DataFrame([feature_df])

        # ── Real mode ────────────────────────────────────────────────────────
        if self.mode == "real":
            if self.model_status != "READY":
                raise RuntimeError(
                    f"ML model unavailable. Status: {self.model_status}. "
                    f"Reason: {self.load_error or 'Unknown'}"
                )

            preds = self.pipeline.predict(feature_df)
            prediction_int = int(preds[0])
            probability = 0.0

            if hasattr(self.pipeline.steps[-1][1], "predict_proba"):
                proba = self.pipeline.predict_proba(feature_df)
                probability = float(proba[0].max())

            risk_level = self._map_risk(prediction_int, probability)

            # ── Anomaly detection ─────────────────────────────────────────
            anomaly_label = "UNAVAILABLE"
            anomaly_score: Optional[float] = None

            if self.anomaly_status == "READY":
                try:
                    iso_pred = self.anomaly_pipeline.predict(feature_df)
                    iso_score = self.anomaly_pipeline.decision_function(feature_df)
                    anomaly_label = "YES" if iso_pred[0] == -1 else "NO"
                    anomaly_score = float(iso_score[0])
                except Exception as e:
                    logger.warning(f"Anomaly detection failed: {e}")
                    anomaly_label = "ERROR"

            from ml.inference.health_score import calculate_health_score
            anomaly_for_health = {"anomaly_label": anomaly_label} if anomaly_score is not None else None
            health_score = calculate_health_score(
                {"risk_level": risk_level, "probability": probability},
                anomaly_for_health
            )

            results = {
                "prediction": self._prediction_label(prediction_int),
                "prediction_probability": probability,
                "risk_level": risk_level,
                "health_score": health_score,
                "anomaly_label": anomaly_label,
                "anomaly_score": anomaly_score,
            }
            return results, self.model_name, self.model_version

        # ── Mock mode (explicit only) ─────────────────────────────────────
        cpu = float(feature_df.get("cpu_usage_percent", [50]).iloc[0]) if hasattr(feature_df, "get") else 50
        mem = float(feature_df.get("memory_percent", [50]).iloc[0]) if hasattr(feature_df, "get") else 50

        if cpu > 90 or mem > 90:
            pred, risk, health, prob = "CRITICAL", "HIGH", 25, 0.91
        elif cpu > 70 or mem > 70:
            pred, risk, health, prob = "WARNING", "MEDIUM", 58, 0.74
        else:
            pred, risk, health, prob = "HEALTHY", "LOW", 85, 0.89

        results = {
            "prediction": pred,
            "prediction_probability": prob,
            "risk_level": risk,
            "health_score": health,
            "anomaly_label": "UNAVAILABLE",
            "anomaly_score": None,
        }
        return results, "mock_model", "mock-v1"

    @staticmethod
    def _prediction_label(pred_int: int) -> str:
        mapping = {0: "HEALTHY", 1: "WARNING", 2: "CRITICAL"}
        return mapping.get(pred_int, f"UNKNOWN({pred_int})")

    @staticmethod
    def _map_risk(prediction_int: int, probability: float) -> str:
        if prediction_int == 0:
            return "LOW"
        elif prediction_int == 1:
            return "MEDIUM" if probability < 0.8 else "HIGH"
        else:
            return "CRITICAL"

    def get_status(self) -> dict:
        return {
            "mode": self.mode,
            "model_status": self.model_status,
            "anomaly_status": self.anomaly_status,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "feature_version": self.feature_version,
            "load_error": self.load_error,
            "expected_feature_count": len(self.expected_features),
        }


ml_adapter = MLAdapter()
