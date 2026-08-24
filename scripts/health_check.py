import httpx
import sys

def main():
    try:
        response_health = httpx.get("http://localhost:8000/health", timeout=5.0)
        response_ready = httpx.get("http://localhost:8000/ready", timeout=5.0)
        
        if response_health.status_code == 200 and response_ready.status_code == 200:
            print("System is healthy and ready.")
            sys.exit(0)
        else:
            print(f"Health check failed. Health: {response_health.status_code}, Ready: {response_ready.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"Health check failed to connect: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
