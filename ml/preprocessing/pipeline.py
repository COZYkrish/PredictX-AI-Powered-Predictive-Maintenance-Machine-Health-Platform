from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

def build_preprocessing_pipeline(feature_cols: list) -> Pipeline:
    """
    Builds a Scikit-Learn Pipeline for preprocessing features.
    Handles missing values and scales features.
    Fit MUST only be called on training data.
    """
    
    # We will just apply median imputation and standard scaling to all numeric features
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, feature_cols)
        ],
        remainder='drop' # Drop columns not explicitly in feature_cols
    )
    
    return preprocessor
