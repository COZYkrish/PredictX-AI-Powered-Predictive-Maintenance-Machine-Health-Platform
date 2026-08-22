from lightgbm import LGBMClassifier

def get_lightgbm():
    return LGBMClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
