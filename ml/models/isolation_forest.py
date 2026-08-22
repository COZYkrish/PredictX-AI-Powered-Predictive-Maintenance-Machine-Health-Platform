from sklearn.ensemble import IsolationForest

def get_isolation_forest():
    return IsolationForest(
        n_estimators=100,
        contamination=0.05, # Expecting 5% anomalies in training data if it's mixed, but ideally trained on healthy
        random_state=42,
        n_jobs=-1
    )
