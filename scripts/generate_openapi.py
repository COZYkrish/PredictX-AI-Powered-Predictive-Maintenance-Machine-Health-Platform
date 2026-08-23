import json
from backend.main import app

def generate_openapi():
    with open("openapi.json", "w") as f:
        json.dump(app.openapi(), f, indent=2)

if __name__ == "__main__":
    generate_openapi()
