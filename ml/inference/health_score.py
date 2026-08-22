def calculate_health_score(prediction_result: dict, anomaly_result: dict = None) -> int:
    """
    Calculates a 0-100 system health score.
    """
    score = 100
    
    # 1. Deduct based on risk prediction
    risk = prediction_result.get("risk_level", "LOW")
    prob = prediction_result.get("probability", 0.0)
    
    if risk == "MEDIUM":
        score -= 20 * prob
    elif risk == "HIGH":
        score -= 40 * prob
    elif risk == "CRITICAL":
        score -= 60 * prob
        
    # 2. Deduct based on anomalies
    if anomaly_result and anomaly_result.get("anomaly_label") == "YES":
        score -= 20
        
    # Bound to 0-100
    return max(0, min(100, int(score)))
