from sklearn.ensemble import RandomForestClassifier

def get_random_forest():
    return RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
