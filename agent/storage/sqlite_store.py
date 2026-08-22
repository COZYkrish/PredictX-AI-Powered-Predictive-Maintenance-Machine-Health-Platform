import sqlite3
from pathlib import Path
from typing import Dict, Any, List
import json
from ..models.telemetry import TelemetrySample

class SQLiteStore:
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS devices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT UNIQUE NOT NULL,
                    hostname TEXT,
                    operating_system TEXT,
                    os_version TEXT,
                    architecture TEXT,
                    first_seen_utc TEXT,
                    last_seen_utc TEXT,
                    agent_version TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS telemetry_samples (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sample_id TEXT UNIQUE NOT NULL,
                    sequence_number INTEGER,
                    schema_version TEXT,
                    agent_version TEXT,
                    timestamp_utc TEXT,
                    device_id TEXT,
                    collection_duration_ms REAL,
                    
                    cpu_usage_percent REAL,
                    cpu_frequency_current_mhz REAL,
                    memory_percent REAL,
                    memory_used_bytes INTEGER,
                    memory_available_bytes INTEGER,
                    disk_usage_percent REAL,
                    disk_read_bytes_per_sec REAL,
                    disk_write_bytes_per_sec REAL,
                    disk_busy_percent REAL,
                    disk_latency_ms REAL,
                    network_upload_bytes_per_sec REAL,
                    network_download_bytes_per_sec REAL,
                    process_count INTEGER,
                    uptime_seconds REAL,
                    
                    cpu_temperature_c REAL,
                    gpu_temperature_c REAL,
                    gpu_usage_percent REAL,
                    gpu_memory_used_bytes INTEGER,
                    gpu_memory_total_bytes INTEGER,
                    battery_percent REAL,
                    storage_temperature_c REAL
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS collector_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp_utc TEXT,
                    collector_name TEXT,
                    status TEXT,
                    error_message TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS device_capabilities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT,
                    metric_name TEXT,
                    category TEXT,
                    available BOOLEAN,
                    source TEXT,
                    last_checked_utc TEXT,
                    reason TEXT,
                    collector_version TEXT,
                    UNIQUE(device_id, metric_name)
                )
            ''')

    def save_sample(self, sample: TelemetrySample):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO telemetry_samples (
                    sample_id, sequence_number, schema_version, agent_version,
                    timestamp_utc, device_id, collection_duration_ms,
                    cpu_usage_percent, cpu_frequency_current_mhz,
                    memory_percent, memory_used_bytes, memory_available_bytes,
                    disk_usage_percent, disk_read_bytes_per_sec, disk_write_bytes_per_sec,
                    disk_busy_percent, disk_latency_ms, network_upload_bytes_per_sec,
                    network_download_bytes_per_sec, process_count, uptime_seconds,
                    cpu_temperature_c, gpu_temperature_c, gpu_usage_percent,
                    gpu_memory_used_bytes, gpu_memory_total_bytes, battery_percent,
                    storage_temperature_c
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                sample.sample_id, sample.sequence_number, sample.schema_version, sample.agent_version,
                sample.timestamp_utc.isoformat(), sample.device_id, sample.collection_duration_ms,
                sample.performance.cpu_usage_percent, sample.performance.cpu_frequency_current_mhz,
                sample.performance.memory_percent, sample.performance.memory_used_bytes, sample.performance.memory_available_bytes,
                sample.performance.disk_usage_percent, sample.performance.disk_read_bytes_per_sec, sample.performance.disk_write_bytes_per_sec,
                sample.performance.disk_busy_percent, sample.performance.disk_latency_ms, sample.performance.network_upload_bytes_per_sec,
                sample.performance.network_download_bytes_per_sec, sample.performance.process_count, sample.performance.uptime_seconds,
                sample.health.cpu_temperature_c, sample.health.gpu_temperature_c, sample.health.gpu_usage_percent,
                sample.health.gpu_memory_used_bytes, sample.health.gpu_memory_total_bytes, sample.health.battery_percent,
                sample.health.storage_temperature_c
            ))

    def update_device(self, device_data: Dict[str, Any]):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO devices (
                    device_id, hostname, operating_system, os_version, architecture,
                    first_seen_utc, last_seen_utc, agent_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(device_id) DO UPDATE SET
                    hostname=excluded.hostname,
                    operating_system=excluded.operating_system,
                    os_version=excluded.os_version,
                    architecture=excluded.architecture,
                    last_seen_utc=excluded.last_seen_utc,
                    agent_version=excluded.agent_version
            ''', (
                device_data['device_id'], device_data.get('hostname'),
                device_data.get('operating_system'), device_data.get('os_version'),
                device_data.get('architecture'), device_data.get('first_seen_utc'),
                device_data.get('last_seen_utc'), device_data.get('agent_version')
            ))

    def save_collector_status(self, timestamp: str, name: str, status: str, error: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO collector_status (timestamp_utc, collector_name, status, error_message)
                VALUES (?, ?, ?, ?)
            ''', (timestamp, name, status, error))

    def save_capability(self, device_id: str, cap: Dict[str, Any]):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO device_capabilities (
                    device_id, metric_name, category, available, source,
                    last_checked_utc, reason, collector_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(device_id, metric_name) DO UPDATE SET
                    available=excluded.available,
                    source=excluded.source,
                    last_checked_utc=excluded.last_checked_utc,
                    reason=excluded.reason,
                    collector_version=excluded.collector_version
            ''', (
                device_id, cap['metric_name'], cap['category'], cap['available'],
                cap.get('source', ''), cap['last_checked_utc'], cap.get('reason', ''),
                cap.get('collector_version', '1.0')
            ))
