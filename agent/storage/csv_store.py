import csv
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

def export_to_csv(db_path: str, export_dir: str):
    db_path = Path(db_path)
    export_dir = Path(export_dir)
    export_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    csv_file = export_dir / f"telemetry_{timestamp}.csv"
    
    if not db_path.exists():
        print(f"Database {db_path} not found.")
        return
        
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM telemetry_samples ORDER BY timestamp_utc ASC")
        rows = cursor.fetchall()
        
        if not rows:
            print("No telemetry samples found.")
            return
            
        columns = [description[0] for description in cursor.description]
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            writer.writerows(rows)
            
    print(f"Exported {len(rows)} samples to {csv_file}")
    return csv_file
