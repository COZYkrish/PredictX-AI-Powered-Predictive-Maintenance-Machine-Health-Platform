# PredictX Architecture

PredictX is an AI-powered system health monitoring platform consisting of four main components:

1. **Windows Telemetry Agent (Python)**: Runs locally on Windows laptops/desktops to collect CPU, RAM, Disk, Network, and Temperature metrics.
2. **PredictX Backend (FastAPI)**: REST API and WebSocket server that handles ingestion, authentication, routing, and database communication.
3. **ML Engine (scikit-learn, joblib)**: Evaluates telemetry data to compute health scores and anomaly risks using algorithms like XGBoost, Random Forest, and Isolation Forest.
4. **PredictX Dashboard (Next.js)**: A React-based web interface to view real-time data, manage alerts, and trigger predictive analysis.

## Data Flow
- Agent collects telemetry and posts via HTTPS to the Backend.
- Backend saves telemetry to PostgreSQL.
- Backend triggers an ML inference job (if configured).
- Backend pushes events via WebSockets to connected Frontend clients.
- Frontend updates UI dynamically without requiring manual refreshes.
