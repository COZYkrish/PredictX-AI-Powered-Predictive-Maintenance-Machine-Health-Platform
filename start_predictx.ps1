# Start PredictX Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Desktop\PredictX'; .\.venv\Scripts\Activate.ps1; alembic upgrade head; uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

# Start PredictX Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Desktop\PredictX\frontend'; npm run dev"

# Start PredictX Windows Agent
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Desktop\PredictX'; .\.venv\Scripts\Activate.ps1; python agent_sync.py"

Write-Output "Starting PredictX..."
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
