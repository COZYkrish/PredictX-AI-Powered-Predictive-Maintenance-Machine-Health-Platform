from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix
import pandas as pd
import numpy as np

def evaluate_model(model, X_test, y_test, is_multiclass=False) -> dict:
    """
    Evaluates a supervised model. Returns a dict of metrics.
    """
    y_pred = model.predict(X_test)
    
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)
    else:
        y_prob = None
        
    avg_type = 'macro' if is_multiclass else 'binary'
    
    metrics = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, average=avg_type, zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, average=avg_type, zero_division=0)),
        'f1': float(f1_score(y_test, y_pred, average=avg_type, zero_division=0))
    }
    
    # Probability metrics
    if y_prob is not None:
        try:
            if is_multiclass:
                metrics['roc_auc'] = float(roc_auc_score(y_test, y_prob, multi_class='ovr'))
                # PR-AUC for multiclass is complex; we just do a rough approximation or skip
            else:
                metrics['roc_auc'] = float(roc_auc_score(y_test, y_prob[:, 1]))
                metrics['pr_auc'] = float(average_precision_score(y_test, y_prob[:, 1]))
        except Exception:
            pass # Handle edge cases where one class might be missing in test
            
    # Confusion matrix
    metrics['confusion_matrix'] = confusion_matrix(y_test, y_pred).tolist()
    
    return metrics
