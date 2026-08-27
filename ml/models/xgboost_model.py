from xgboost import XGBClassifier

def get_xgboost():
    """
    Binary XGBoost classifier for HEALTHY (0) vs WARNING (1) system health.
    - objective='binary:logistic' for binary classification
    - eval_metric='logloss' (binary cross-entropy)
    - scale_pos_weight handles class imbalance (~77% WARNING, ~23% HEALTHY)
      scale_pos_weight = n_negative / n_positive = 290/963 ≈ 0.30
    """
    return XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        objective='binary:logistic',
        eval_metric='logloss',
        scale_pos_weight=0.30,   # compensates for 77% WARNING class majority
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        enable_categorical=False,
    )
