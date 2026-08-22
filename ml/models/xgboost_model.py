from xgboost import XGBClassifier

def get_xgboost():
    # We will use early stopping in the training loop if validation set is provided,
    # but the base estimator is defined here.
    return XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='mlogloss', # for multi-class or 'logloss' for binary
        use_label_encoder=False,
        n_jobs=-1
    )
