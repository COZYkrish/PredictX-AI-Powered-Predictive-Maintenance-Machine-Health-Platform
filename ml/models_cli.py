from pathlib import Path
import json

def main():
    print("Available Models")
    print("-" * 16)
    print("\nSupervised:")
    print("- Majority Baseline")
    print("- Logistic Regression")
    print("- Random Forest")
    print("- XGBoost")
    print("- LightGBM")
    
    print("\nUnsupervised:")
    print("- Isolation Forest")
    
    print("\nInstalled Artifacts:")
    artifacts_dir = Path(__file__).parent / "artifacts" / "models"
    models = list(artifacts_dir.glob("*.joblib"))
    
    if not models:
        print("No models trained yet.")
    else:
        for m in models:
            print(f"- {m.name}")

if __name__ == "__main__":
    main()
