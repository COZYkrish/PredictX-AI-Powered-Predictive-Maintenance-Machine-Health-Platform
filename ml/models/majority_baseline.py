import numpy as np

class MajorityBaselineClassifier:
    """Always predicts the most common class seen during training."""
    
    def __init__(self):
        self.majority_class_ = None
        self.classes_ = None
        
    def fit(self, X, y):
        # find the most common class
        values, counts = np.unique(y, return_counts=True)
        self.majority_class_ = values[np.argmax(counts)]
        self.classes_ = values
        return self
        
    def predict(self, X):
        return np.full(shape=(X.shape[0],), fill_value=self.majority_class_)
        
    def predict_proba(self, X):
        # returns 1.0 for majority class, 0.0 for others
        proba = np.zeros((X.shape[0], len(self.classes_)))
        maj_idx = np.where(self.classes_ == self.majority_class_)[0][0]
        proba[:, maj_idx] = 1.0
        return proba
