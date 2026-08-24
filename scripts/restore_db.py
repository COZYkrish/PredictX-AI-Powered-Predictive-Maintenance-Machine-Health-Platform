import os
import subprocess
import argparse
from dotenv import load_dotenv

def main():
    parser = argparse.ArgumentParser(description="Restore PostgreSQL database from backup.")
    parser.add_argument("backup_file", help="Path to the backup SQL file")
    args = parser.parse_args()

    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is not set.")
        exit(1)
    
    if not os.path.exists(args.backup_file):
        print(f"Backup file {args.backup_file} does not exist.")
        exit(1)
        
    try:
        print(f"Restoring database from {args.backup_file}...")
        # Note: psql must be in the system PATH
        subprocess.run(["psql", db_url, "-f", args.backup_file], check=True)
        print("Database restored successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Restore failed: {e}")
        exit(1)
    except FileNotFoundError:
        print("psql utility not found. Please ensure PostgreSQL tools are installed and in PATH.")
        exit(1)

if __name__ == "__main__":
    main()
