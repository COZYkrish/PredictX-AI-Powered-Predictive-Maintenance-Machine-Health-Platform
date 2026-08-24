# PredictX Deployment Guide

## Prerequisites
- Docker & Docker Compose
- PostgreSQL 15 (if not using Compose)
- Node.js 20+ (for manual frontend build)
- Python 3.11+ (for manual backend build)

## Containerized Deployment
The easiest way to deploy PredictX is using Docker Compose.

1. Configure your environment:
   ```bash
   cp .env.example .env
   ```
2. Start the infrastructure:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```
   *Note: This spins up the database, runs migrations, and starts the frontend and backend.*

## Manual Deployment

### Backend
1. Activate virtual environment and install dependencies.
2. Run Migrations: `alembic upgrade head`.
3. Start FastAPI: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`.

### Frontend
1. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.
2. Build the app: `npm run build`.
3. Start the app: `npm run start`.
