import os
import json
import hashlib
import sys

MODEL_DIR = "ml/artifacts/models"

def get_sha256(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def verify_model():
    if not os.path.exists(MODEL_DIR):
        print("Model directory not found.")
        sys.exit(1)
        
    metadata_path = os.path.join(MODEL_DIR, "metadata.json")
    if not os.path.exists(metadata_path):
        print("Model metadata.json not found.")
        sys.exit(1)
        
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Failed to load metadata.json: {e}")
        sys.exit(1)

    print("Verifying model artifacts...")
    all_good = True
    for artifact in metadata.get("artifacts", []):
        filename = artifact.get("filename")
        expected_hash = artifact.get("sha256")
        
        filepath = os.path.join(MODEL_DIR, filename)
        if not os.path.exists(filepath):
            print(f"[FAIL] Missing artifact: {filename}")
            all_good = False
            continue
            
        actual_hash = get_sha256(filepath)
        if actual_hash != expected_hash:
            print(f"[FAIL] Hash mismatch for {filename}")
            print(f"  Expected: {expected_hash}")
            print(f"  Actual:   {actual_hash}")
            all_good = False
        else:
            print(f"[OK] {filename}")

    if all_good:
        print("Model verification successful.")
        sys.exit(0)
    else:
        print("Model verification failed.")
        sys.exit(1)

if __name__ == "__main__":
    verify_model()
