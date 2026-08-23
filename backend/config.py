from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "PredictX"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # DB
    DATABASE_URL: str
    TEST_DATABASE_URL: str
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # ML
    ML_MODE: str = "real"
    
    # Business logic
    TELEMETRY_RETENTION_DAYS: int = 90
    ALERT_COOLDOWN_MINUTES: int = 15
    
    LOG_LEVEL: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", ".env"), 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
