# PredictX API Documentation

The PredictX platform provides a FastAPI-based backend for receiving telemetry from Windows devices and querying system health, alerts, and predictions.

## Authentication
PredictX uses OAuth2 with JWT (JSON Web Tokens). Most endpoints require an `Authorization: Bearer <token>` header.

### `POST /api/v1/auth/login`
Authenticates a user and returns a JWT.
- **Request**: Form data with `username` and `password`.
- **Response**: `{"access_token": "...", "token_type": "bearer"}`

## Telemetry
### `POST /api/v1/telemetry/batch`
Uploads a batch of telemetry samples from a Windows agent.
- **Request**: JSON array of `samples`.
- **Response**: `{"accepted": 1, "duplicates": 0}`

### `GET /api/v1/telemetry/device/{device_id}`
Retrieves recent telemetry for a device.

## Real-Time Events (WebSocket)
### `WS /ws/devices/{device_id}`
Establishes a WebSocket connection for real-time telemetry updates.
- **Events sent**: `telemetry.updated`, `alert.created`, `prediction.completed`.

For more details, see the Swagger documentation available at `http://localhost:8000/docs` when running the application.
