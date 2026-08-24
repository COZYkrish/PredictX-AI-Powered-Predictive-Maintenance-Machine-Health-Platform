import os
import subprocess
import datetime
from dotenv import load_dotenv

def main():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is not set.")
        exit(1)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backup_{timestamp}.sql"
    
    try:
        print(f"Starting backup to {backup_file}...")
        # Note: pg_dump must be in the system PATH
        subprocess.run(["pg_dump", db_url, "-f", backup_file], check=True)
        print(f"Backup successfully saved to {backup_file}")
    except subprocess.CalledProcessError as e:
        print(f"Backup failed: {e}")
        exit(1)
    except FileNotFoundError:
        print("pg_dump utility not found. Please ensure PostgreSQL tools are installed and in PATH.")
        exit(1)

if __name__ == "__main__":
    main()
