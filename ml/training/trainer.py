import os
import joblib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from sklearn.pipeline import Pipeline
import pandas as pd

from ..data.splitter import time_based_split
from ..preprocessing.pipeline import build_preprocessing_pipeline
from ..models import (
    MajorityBaselineClassifier, get_logistic_regression,
    get_random_forest, get_xgboost, get_lightgbm, get_isolation_forest
)
from .evaluator import evaluate_model
from .model_selection import select_best_model
from ..config import ML_CONFIG

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
MODELS_DIR = ARTIFACTS_DIR / "models"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
(ARTIFACTS_DIR / "feature_metadata").mkdir(parents=True, exist_ok=True)
(ARTIFACTS_DIR / "reports").mkdir(parents=True, exist_ok=True)

def train_pipeline(df: pd.DataFrame, target_col: str = 'proxy_health_label'):
    logger.info(f"Starting training pipeline with {len(df)} samples.")
    
    # 1. Enforce minimum requirements
    req = ML_CONFIG.get("data_requirements", {})
    min_samples = req.get("minimum_samples", 10)
    if len(df) < min_samples:
        logger.error(f"Insufficient data. Need {min_samples}, got {len(df)}")
        return
        
    # Check class distribution
    if df[target_col].nunique() < 2:
        logger.error("Dataset must contain at least 2 classes for classification.")
        return
        
    # 2. Split
    train_df, val_df, test_df = time_based_split(df, train_frac=0.7, val_frac=0.15)
    logger.info(f"Split sizes: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    
    # Identify feature columns (everything numeric except target and metadata)
    exclude_cols = ['sample_id', 'sequence_number', 'timestamp_utc', 'device_id', target_col]
    feature_cols = [c for c in df.select_dtypes(include='number').columns if c not in exclude_cols]
    
    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]
    
    # 3. Preprocessing
    preprocessor = build_preprocessing_pipeline(feature_cols)
    preprocessor.fit(X_train)
    
    X_train_prep = preprocessor.transform(X_train)
    X_val_prep = preprocessor.transform(X_val)
    X_test_prep = preprocessor.transform(X_test)
    
    # 4. Train Models
    models_to_train = {
        "MajorityBaseline": MajorityBaselineClassifier(),
        "LogisticRegression": get_logistic_regression(),
        "RandomForest": get_random_forest(),
        "XGBoost": get_xgboost(),
        "LightGBM": get_lightgbm()
    }
    
    metrics_report = {}
    fitted_models = {}
    
    for name, model in models_to_train.items():
        logger.info(f"Training {name}...")
        try:
            if name == "XGBoost":
                # XGBoost specific early stopping
                model.fit(
                    X_train_prep, y_train, 
                    eval_set=[(X_val_prep, y_val)],
                    verbose=False
                )
            elif name == "LightGBM":
                # LightGBM early stopping
                from lightgbm import early_stopping
                model.fit(
                    X_train_prep, y_train,
                    eval_set=[(X_val_prep, y_val)],
                    callbacks=[early_stopping(stopping_rounds=10, verbose=False)]
                )
            else:
                model.fit(X_train_prep, y_train)
                
            metrics = evaluate_model(model, X_test_prep, y_test, is_multiclass=(df[target_col].nunique() > 2))
            metrics_report[name] = metrics
            fitted_models[name] = model
            logger.info(f"{name} metrics: F1={metrics.get('f1', 0):.4f}")
        except Exception as e:
            logger.error(f"Failed to train {name}: {e}")
            
    # 5. Select Best Model
    best_model_name = select_best_model(metrics_report)
    logger.info(f"Best model selected: {best_model_name}")
    
    # 6. Save Artifacts
    best_model = fitted_models[best_model_name]
    full_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', best_model)
    ])
    
    model_version = "v1.0.0"
    model_filename = f"system_health_{best_model_name.lower()}_{model_version}.joblib"
    joblib.dump(full_pipeline, MODELS_DIR / model_filename)
    
    # Save Metadata
    metadata = {
        "model_name": best_model_name,
        "model_version": model_version,
        "feature_version": "1.0",
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "feature_count": len(feature_cols),
        "features": feature_cols,
        "metrics": metrics_report[best_model_name],
        "prediction_threshold": 0.5
    }
    
    with open(MODELS_DIR / f"metadata_{model_version}.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    with open(ARTIFACTS_DIR / "feature_metadata" / "feature_schema.json", "w") as f:
        json.dump({"features": feature_cols, "version": "1.0"}, f, indent=2)
        
    with open(ARTIFACTS_DIR / "reports" / f"evaluation_{model_version}.json", "w") as f:
        json.dump(metrics_report, f, indent=2)
        
    logger.info(f"Training complete. Artifacts saved to {MODELS_DIR}")
    
    # 7. Anomaly Detection (Unsupervised)
    logger.info("Training Isolation Forest...")
    iso = get_isolation_forest()
    # Train only on 'HEALTHY' proxy data
    healthy_X = X_train[y_train == 0]
    if len(healthy_X) > 0:
        healthy_X_prep = preprocessor.transform(healthy_X)
        iso.fit(healthy_X_prep)
        
        iso_pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('anomaly_detector', iso)
        ])
        joblib.dump(iso_pipeline, MODELS_DIR / f"anomaly_isolation_forest_{model_version}.joblib")
        logger.info("Anomaly detector saved.")
