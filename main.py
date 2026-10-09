"""
SIGNBRIDGE AI - Root Application Entry Point for Cloud Deployment (Render)
Runs the unified FastAPI application serving both REST API endpoints and the React Frontend SPA.
"""
import os
import sys

# Ensure signbridge-ai directory is in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
sub_dir = os.path.join(root_dir, "signbridge-ai")
if sub_dir not in sys.path:
    sys.path.insert(0, sub_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Import the FastAPI application instance
from backend.app import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[SIGNBRIDGE AI] Starting unified server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
