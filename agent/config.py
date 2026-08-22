import os
from .utils.system_id import get_or_create_device_id

class Config:
    def __init__(self):
        self.device_id = get_or_create_device_id()
        self.interval = int(os.environ.get("COLLECTION_INTERVAL_SECONDS", "10"))
        self.db_path = os.environ.get("DATABASE_PATH", "data/predictx.db")
        self.log_path = os.environ.get("LOG_PATH", "logs/agent.log")
        self.agent_version = "0.1.0"
        self.schema_version = "1.0"
        
config = Config()
