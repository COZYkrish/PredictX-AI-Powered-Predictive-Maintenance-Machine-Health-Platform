from datetime import datetime, timezone
import pytest

def test_telemetry_batch_upload_unauthorized(client):
    # Setup test device
    client.post("/api/v1/auth/register", json={"email": "tel@test.com", "password": "pass"})
    resp = client.post("/api/v1/auth/login", data={"username": "tel@test.com", "password": "pass"})
    token = resp.json()["access_token"]
    
    client.post(
        "/api/v1/devices/",
        json={"device_id": "TEST-001", "hostname": "Test-PC"},
        headers={"Authorization": f"Bearer {token}"}
    )
    payload = {
        "samples": [
            {
                "device_id": "TEST-001",
                "sample_id": "samp-001",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "cpu_usage_percent": 45.0,
                "memory_percent": 60.0
            }
        ]
    }
    response = client.post("/api/v1/telemetry/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["accepted"] == 1
    assert data["duplicates"] == 0

def test_telemetry_batch_idempotent(client):
    # Setup test device
    client.post("/api/v1/auth/register", json={"email": "tel2@test.com", "password": "pass"})
    resp = client.post("/api/v1/auth/login", data={"username": "tel2@test.com", "password": "pass"})
    token = resp.json()["access_token"]
    
    client.post(
        "/api/v1/devices/",
        json={"device_id": "TEST-001", "hostname": "Test-PC"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    payload = {
        "samples": [
            {
                "device_id": "TEST-001",
                "sample_id": "samp-002",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "cpu_usage_percent": 45.0,
                "memory_percent": 60.0
            }
        ]
    }
    # First upload
    response1 = client.post("/api/v1/telemetry/batch", json=payload)
    assert response1.status_code == 200
    assert response1.json()["accepted"] == 1
    
    # Second upload should be marked as duplicate
    response2 = client.post("/api/v1/telemetry/batch", json=payload)
    assert response2.status_code == 200
    assert response2.json()["accepted"] == 0
    assert response2.json()["duplicates"] == 1
