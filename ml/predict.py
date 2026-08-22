import argparse
import json
import logging
from pathlib import Path
from .inference.predictor import Predictor
from .inference.anomaly_detector import AnomalyDetector
from .inference.health_score import calculate_health_score

logging.basicConfig(level=logging.INFO, format='%(message)s')

def main():
    parser = argparse.ArgumentParser(description="PredictX Single Sample Predictor")
    parser.add_argument("--input", type=str, required=True, help="Path to JSON sample")
    
    # We find the latest model artifacts automatically for convenience, or they could be passed
    artifacts_dir = Path(__file__).parent / "artifacts" / "models"
    
    # Just picking the first joblib files for demonstration in a real app these would be tracked
    supervised_models = list(artifacts_dir.glob("system_health_*.joblib"))
    anomaly_models = list(artifacts_dir.glob("anomaly_*.joblib"))
    
    if not supervised_models:
        print("No supervised model found. Train first.")
        return
        
    with open(parser.parse_args().input, 'r') as f:
        sample = json.load(f)
        
    predictor = Predictor(str(supervised_models[0]))
    pred_res = predictor.predict(sample)
    
    anomaly_res = None
    if anomaly_models:
        detector = AnomalyDetector(str(anomaly_models[0]))
        anomaly_res = detector.detect(sample)
        
    health = calculate_health_score(pred_res, anomaly_res)
    
    print("\nPredictX ML Result")
    print("-" * 20)
    print(f"Model: {supervised_models[0].name}")
    print(f"Prediction: {pred_res['prediction']} ({pred_res['risk_level']})")
    print(f"Probability: {pred_res['probability']:.4f}")
    print(f"Health Score: {health}")
    
    if anomaly_res:
        print(f"Anomaly: {anomaly_res['anomaly_label']}")
        
if __name__ == "__main__":
    main()
