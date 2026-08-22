import pandas as pd

def select_best_model(metrics_dict: dict) -> str:
    """
    Selects the best model based on a configurable policy.
    Default policy: Recall > PR-AUC > F1 > Precision
    """
    # Create a DataFrame from the metrics dictionary
    # format: { 'model_name': { 'recall': 0.8, 'f1': 0.7 ... } }
    
    if not metrics_dict:
        raise ValueError("No metrics provided for selection.")
        
    df = pd.DataFrame.from_dict(metrics_dict, orient='index')
    
    # Sort models. 
    # If it's a binary classification and 'pr_auc' exists, use it. Otherwise use F1.
    sort_cols = []
    if 'recall' in df.columns:
        sort_cols.append('recall')
    if 'pr_auc' in df.columns:
        sort_cols.append('pr_auc')
    if 'f1' in df.columns:
        sort_cols.append('f1')
    if 'precision' in df.columns:
        sort_cols.append('precision')
        
    if not sort_cols:
        sort_cols = list(df.columns)
        
    df = df.sort_values(by=sort_cols, ascending=False)
    
    best_model_name = df.index[0]
    return best_model_name
