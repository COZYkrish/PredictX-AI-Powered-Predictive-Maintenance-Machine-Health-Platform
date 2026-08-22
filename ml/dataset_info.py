import argparse
import json
import logging
from .data.dataset_builder import build_dataset

logging.basicConfig(level=logging.INFO, format='%(message)s')

def main():
    parser = argparse.ArgumentParser(description="PredictX Dataset Info")
    parser.add_argument("--dataset", type=str, default="data/predictx.db", help="Path to telemetry dataset")
    args = parser.parse_args()
    
    print(f"PredictX Dataset Report for {args.dataset}")
    print("-" * 40)
    
    df = build_dataset(args.dataset)
    if df.empty:
        print("Dataset is empty.")
        return
        
    print(f"Samples: {len(df)}")
    print(f"Devices: {df['device_id'].nunique()}")
    print(f"Duration: {df['timestamp_utc'].max() - df['timestamp_utc'].min()}")
    print("")
    
    print("Features:")
    numeric_cols = df.select_dtypes(include='number').columns
    print(f"Total Features: {len(numeric_cols)}")
    
    print("\nMissing Data (%)")
    missing_pct = (df.isnull().mean() * 100).round(1)
    for col, pct in missing_pct[missing_pct > 0].items():
        print(f"{col}: {pct}%")
        
    if 'proxy_health_label' in df.columns:
        print("\nTargets (proxy_health_label):")
        dist = df['proxy_health_label'].value_counts(normalize=True) * 100
        for label, pct in dist.items():
            name = "HEALTHY" if label == 0 else "WARNING" if label == 1 else "CRITICAL"
            print(f"{name} ({label}): {pct:.1f}%")

if __name__ == "__main__":
    main()
