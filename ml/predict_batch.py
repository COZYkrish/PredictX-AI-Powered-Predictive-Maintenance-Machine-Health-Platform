import argparse
import logging
from pathlib import Path
from .data.loader import load_data
from .inference.predictor import Predictor
from .inference.anomaly_detector import AnomalyDetector
from .inference.health_score import calculate_health_score
import pandas as pd

logging.basicConfig(level=logging.INFO, format='%(message)s')

def main():
    parser = argparse.ArgumentParser(description="PredictX Batch Predictor")
    parser.add_argument("--input", type=str, required=True, help="Path to input dataset (csv, sqlite, json)")
    parser.add_argument("--output", type=str, required=True, help="Path to save predictions (csv)")
    
    args = parser.parse_args()
    
    # Locate latest artifacts
    artifacts_dir = Path(__file__).parent / "artifacts" / "models"
    supervised_models = list(artifacts_dir.glob("system_health_*.joblib"))
    anomaly_models = list(artifacts_dir.glob("anomaly_*.joblib"))
    
    if not supervised_models:
        logging.error("No supervised model found. Train first.")
        return
        
    df = load_data(args.input)
    if df.empty:
        logging.error("Input data is empty.")
        return
        
    predictor = Predictor(str(supervised_models[0]))
    supervised_res = predictor.predict_batch(df)
    
    anomaly_res = []
    if anomaly_models:
        detector = AnomalyDetector(str(anomaly_models[0]))
        anomaly_res = detector.detect_batch(df)
    else:
        anomaly_res = [{"anomaly_label": "UNKNOWN", "anomaly_score": 0.0}] * len(df)
        
    # Build output dataframe
    output_rows = []
    for i, (sup, anom) in enumerate(zip(supervised_res, anomaly_res)):
        health = calculate_health_score(sup, anom)
        row = {
            "sample_id": df.iloc[i].get("sample_id", "unknown"),
            "device_id": df.iloc[i].get("device_id", "unknown"),
            "timestamp_utc": df.iloc[i].get("timestamp_utc", "unknown"),
            "prediction": sup["prediction"],
            "probability": sup["probability"],
            "risk_level": sup["risk_level"],
            "health_score": health,
            "anomaly_label": anom.get("anomaly_label"),
            "anomaly_score": anom.get("anomaly_score"),
            "model_version": supervised_models[0].name
        }
        output_rows.append(row)
        
    out_df = pd.DataFrame(output_rows)
    out_df.to_csv(args.output, index=False)
    logging.info(f"Predictions saved to {args.output}")

if __name__ == "__main__":
    main()
