import yaml
from pathlib import Path

def load_config():
    # Try ml/config/labels.yaml first (canonical location)
    config_path = Path(__file__).parent / "config" / "labels.yaml"
    if not config_path.exists():
        # Fallback: same directory as config.py
        config_path = Path(__file__).parent / "labels.yaml"
    if not config_path.exists():
        return {}
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

ML_CONFIG = load_config()
