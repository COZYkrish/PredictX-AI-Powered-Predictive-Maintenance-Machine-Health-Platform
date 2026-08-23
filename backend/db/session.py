from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.config import settings

# In tests, the TEST_DATABASE_URL should be used
engine = create_engine(
    settings.DATABASE_URL if settings.APP_ENV != "testing" else settings.TEST_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
