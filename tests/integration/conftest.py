import os
# Force testing environment before loading anything
os.environ["APP_ENV"] = "testing"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.db.base import Base
from backend.config import settings
from backend.db.session import get_db

# Ensure we're actually using the test database
assert "test" in settings.DATABASE_URL.lower() or "test" in settings.TEST_DATABASE_URL.lower(), "Danger: Tests not running against test DB"

# Use the test DB URL
SQLALCHEMY_DATABASE_URL = settings.TEST_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Setup test DB tables
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown test DB tables
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
