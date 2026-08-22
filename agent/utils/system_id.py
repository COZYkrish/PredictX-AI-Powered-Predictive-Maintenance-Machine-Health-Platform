import uuid
from pathlib import Path

def get_or_create_device_id(config_dir: Path = Path("config")) -> str:
    """
    Gets the existing device ID or creates a new one and saves it.
    """
    config_dir.mkdir(parents=True, exist_ok=True)
    device_id_file = config_dir / "device_id.txt"
    
    if device_id_file.exists():
        with open(device_id_file, "r") as f:
            device_id = f.read().strip()
            if device_id:
                return device_id
                
    new_id = str(uuid.uuid4())
    with open(device_id_file, "w") as f:
        f.write(new_id)
        
    return new_id
