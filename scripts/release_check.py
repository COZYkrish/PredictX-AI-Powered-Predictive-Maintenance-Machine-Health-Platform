import os
import json
import subprocess
import sys
from datetime import datetime

def run_command(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, shell=True, check=True, cwd=cwd, capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {cmd}")
        print(e.output)
        return None

def check_release():
    print("Running Pre-Release Checks...")
    
    # 1. Verify Model
    print("\n--- 1. ML Model Verification ---")
    model_check = run_command("python scripts/verify_model.py")
    if model_check is None:
        print("Model verification failed. Aborting release.")
        sys.exit(1)
    else:
        print("Model verification passed.")

    # 2. Check for required directories
    print("\n--- 2. Directory Structure Verification ---")
    required_dirs = ["frontend", "backend", "agent", "docker", ".github"]
    for d in required_dirs:
        if not os.path.exists(d):
            print(f"Missing required directory: {d}")
            sys.exit(1)
    print("Directory structure intact.")

    # 3. Create Release Manifest
    print("\n--- 3. Generating Release Manifest ---")
    manifest = {
        "project": "PredictX",
        "version": "1.0.0",
        "frontend_version": "1.0.0",
        "backend_version": "1.0.0",
        "agent_version": "1.0.0",
        "ml_model_version": "1.0.0",
        "schema_version": "1.0",
        "feature_version": "1.0",
        "build_timestamp_utc": datetime.utcnow().isoformat(),
    }
    
    # Try to get git commit
    git_commit = run_command("git rev-parse HEAD")
    manifest["git_commit"] = git_commit if git_commit else "unknown"

    with open("release_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    
    print("Release manifest generated successfully: release_manifest.json")
    print("\nRELEASE CHECK PASSED.")
    sys.exit(0)

if __name__ == "__main__":
    check_release()
