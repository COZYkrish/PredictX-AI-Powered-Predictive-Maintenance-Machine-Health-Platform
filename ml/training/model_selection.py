import pandas as pd

def select_best_model(metrics_dict: dict) -> str:
    """
    Selects the best model based on a configurable policy.
    Default policy: Recall > PR-AUC > F1 > Precision
    Tiebreaker: XGBoost is preferred over other models of equal performance
    because it provides feature importance and is the most interpretable
    gradient boosting method for academic reporting.
    """
    if not metrics_dict:
        raise ValueError("No metrics provided for selection.")
        
    df = pd.DataFrame.from_dict(metrics_dict, orient='index')
    
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
    
    # Find all models tied at the top score
    top_score = df[sort_cols[0]].iloc[0]
    tied_models = df[df[sort_cols[0]] == top_score].index.tolist()
    
    # Preference order for ties: XGBoost > RandomForest > LightGBM > others
    preference = ["XGBoost", "RandomForest", "LightGBM", "LogisticRegression"]
    for preferred in preference:
        if preferred in tied_models:
            return preferred
    
    return df.index[0]
