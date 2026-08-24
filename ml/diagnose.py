"""
PredictX ML Diagnostic — run with: python -m ml.diagnose

Tests:
  A. Artifact availability and loading
  B. Real telemetry → feature builder → model inference (end-to-end)
"""

import sys
import os
import re
import json
import logging
from pathlib import Path

# Ensure project root is on path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Suppress noisy library warnings
logging.basicConfig(level=logging.WARNING)
os.environ.setdefault("ENV_FILE", ".env")

MODELS_DIR = PROJECT_ROOT / "ml" / "artifacts" / "models"
PREDICTOR_FILE = "system_health_xgboost_v1.0.0.joblib"
ANOMALY_FILE = "anomaly_isolation_forest_v1.0.0.joblib"
METADATA_FILE = "metadata.json"

SEP = "=" * 55


def _ok(msg):
    print(f"  [OK]   {msg}")


def _fail(msg):
    print(f"  [FAIL] {msg}")


def _warn(msg):
    print(f"  [WARN] {msg}")


def _load_metadata():
    path = MODELS_DIR / METADATA_FILE
    if not path.exists():
        return None
    raw = path.read_text()
    raw = re.sub(r'\bNaN\b', 'null', raw)
    return json.loads(raw)


# ─────────────────────────────────────────────────────────────────────────────
# TEST A — Artifacts
# ─────────────────────────────────────────────────────────────────────────────
def test_artifacts():
    print(f"\n  {'─'*55}".replace('─', '-'))
    print("  TEST A --- Artifact Availability")
    print(f"  {'─'*55}".replace('─', '-'))

    meta = _load_metadata()
    passed = True

    # Metadata
    if meta:
        _ok(f"Metadata loaded: model_name={meta.get('model_name')} "
            f"version={meta.get('model_version')} "
            f"features={meta.get('feature_count')}")
    else:
        _fail("metadata.json not found or invalid")
        passed = False

    # Predictor
    pred_path = MODELS_DIR / PREDICTOR_FILE
    if pred_path.exists():
        size_kb = pred_path.stat().st_size // 1024
        _ok(f"Predictor artifact: {PREDICTOR_FILE} ({size_kb} KB)")
    else:
        _fail(f"Predictor artifact NOT FOUND: {pred_path}")
        passed = False

    # Anomaly
    anom_path = MODELS_DIR / ANOMALY_FILE
    if anom_path.exists():
        size_kb = anom_path.stat().st_size // 1024
        _ok(f"Anomaly artifact:   {ANOMALY_FILE} ({size_kb} KB)")
    else:
        _fail(f"Anomaly artifact NOT FOUND: {anom_path}")
        passed = False

    # Load predictor
    if pred_path.exists():
        try:
            import joblib
            pipeline = joblib.load(pred_path)
            classifier = pipeline.steps[-1][1]
            _ok(f"Predictor loads OK: {type(classifier).__name__}")
        except Exception as e:
            _fail(f"Predictor failed to load: {e}")
            passed = False
    
    # Load anomaly
    if anom_path.exists():
        try:
            import joblib
            anom_pipeline = joblib.load(anom_path)
            _ok(f"Anomaly detector loads OK: {type(anom_pipeline.steps[-1][1]).__name__}")
        except Exception as e:
            _fail(f"Anomaly detector failed to load: {e}")
            passed = False

    return passed, meta


# ─────────────────────────────────────────────────────────────────────────────
# TEST B — Real telemetry inference
# ─────────────────────────────────────────────────────────────────────────────
def test_real_inference(meta):
    print(f"\n  {'─'*55}".replace('─', '-'))
    print("  TEST B --- Real Telemetry End-to-End")
    print(f"  {'─'*55}".replace('─', '-'))

    passed = True

    # ── Connect to database ───────────────────────────────────────────────────
    try:
        from backend.db.session import SessionLocal
        from backend.models.telemetry import TelemetrySample
        db = SessionLocal()
        count = db.query(TelemetrySample).count()
        _ok(f"Database connected: {count} telemetry samples")
    except Exception as e:
        _fail(f"Database connection failed: {e}")
        return False

    # Find a device with real data
    try:
        from backend.models.device import Device
        device = (
            db.query(Device)
            .filter(Device.hostname != None)
            .first()
        )
        if not device:
            _fail("No device with real hostname found in database.")
            db.close()
            return False
        _ok(f"Device: {device.device_id} (hostname={device.hostname})")
    except Exception as e:
        _fail(f"Device query failed: {e}")
        db.close()
        return False

    # ── Feature builder ───────────────────────────────────────────────────────
    try:
        from backend.ml.feature_builder import (
            build_features, InsufficientDataError, required_history_seconds, EXPECTED_FEATURES
        )
        print(f"\n  Required history: {required_history_seconds()}s")
        print(f"  Expected features: {len(EXPECTED_FEATURES)}")
        feature_df = build_features(db, device.device_id)
        _ok(f"Feature builder: {feature_df.shape[1]} features generated")
    except InsufficientDataError as ide:
        _warn(f"Feature builder: INSUFFICIENT_DATA — {ide}")
        print()
        print("  >> Ensure the agent has been running for at least "
              f"{required_history_seconds()}s")
        db.close()
        return False
    except Exception as e:
        _fail(f"Feature builder failed: {e}")
        db.close()
        return False

    # ── ML inference ──────────────────────────────────────────────────────────
    try:
        import joblib
        pipeline = joblib.load(MODELS_DIR / PREDICTOR_FILE)

        preds = pipeline.predict(feature_df)
        prediction_int = int(preds[0])
        prob_arr = pipeline.predict_proba(feature_df) if hasattr(pipeline.steps[-1][1], "predict_proba") else None
        probability = float(prob_arr[0].max()) if prob_arr is not None else None

        labels = {0: "HEALTHY", 1: "WARNING", 2: "CRITICAL"}
        prediction_str = labels.get(prediction_int, f"UNKNOWN({prediction_int})")

        risk_map = {0: "LOW", 1: "MEDIUM" if (probability or 0) < 0.8 else "HIGH", 2: "CRITICAL"}
        risk = risk_map.get(prediction_int, "UNKNOWN")

        _ok(f"XGBoost inference: OK")
        print(f"\n  +{'-'*40}+")
        print(f"  | {'Prediction:':<22} {prediction_str:<16} |")
        if probability is not None:
            print(f"  | {'Probability:':<22} {probability:.1%:<16} |")
        print(f"  | {'Risk Level:':<22} {risk:<16} |")
    except Exception as e:
        _fail(f"XGBoost inference failed: {e}")
        passed = False
        probability = None
        prediction_str = "N/A"
        risk = "N/A"

    # ── Health score ──────────────────────────────────────────────────────────
    try:
        from ml.inference.health_score import calculate_health_score
        health = calculate_health_score(
            {"risk_level": risk, "probability": probability or 0.0}
        )
        print(f"  | {'Health Score:':<22} {health}/100{'':<11} |")
    except Exception as e:
        health = "N/A"
        print(f"  | {'Health Score:':<22} {'N/A (error)':<16} |")

    # ── Anomaly detection ─────────────────────────────────────────────────────
    try:
        anom_pipeline = joblib.load(MODELS_DIR / ANOMALY_FILE)
        anom_pred = anom_pipeline.predict(feature_df)
        anom_score = anom_pipeline.decision_function(feature_df)
        anomaly_label = "YES" if anom_pred[0] == -1 else "NO"
        anomaly_score = float(anom_score[0])
        print(f"  | {'Anomaly Label:':<22} {anomaly_label:<16} |")
        print(f"  | {'Anomaly Score:':<22} {anomaly_score:.4f}{'':<10} |")
    except Exception as e:
        print(f"  | {'Anomaly:':<22} {'ERROR: ' + str(e)[:16]:<16} |")

    print(f"  +{'-'*40}+")

    db.close()
    return passed


# ─────────────────────────────────────────────────────────────────────────────
def main():
    print(f"\n{SEP}")
    print("  PredictX ML Diagnostic")
    print(f"{SEP}")

    ok_a, meta = test_artifacts()
    ok_b = test_real_inference(meta)

    print(f"\n{SEP}")
    summary_a = "PASS" if ok_a else "FAIL"
    summary_b = "PASS" if ok_b else "FAIL"
    print(f"  Test A (Artifacts):  {summary_a}")
    print(f"  Test B (Inference):  {summary_b}")
    overall = "PASS" if (ok_a and ok_b) else "PARTIAL/FAIL"
    print(f"  Overall:             {overall}")
    print(f"{SEP}\n")

    sys.exit(0 if (ok_a and ok_b) else 1)


if __name__ == "__main__":
    main()
