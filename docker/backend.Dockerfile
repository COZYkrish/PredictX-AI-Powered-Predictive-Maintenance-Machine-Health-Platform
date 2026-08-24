FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY alembic.ini .
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Command to run (migrations must be run separately via deployment script)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
