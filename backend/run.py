#!/usr/bin/env python3
"""Run the Flask development server for Fake Job Posting Detection."""
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

if __name__ == "__main__":
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")
    print(f"[*] Starting Verdict Flask API on http://{host}:{port} (DB_BACKEND={app.config.get('DB_BACKEND')})")
    app.run(host=host, port=port, debug=debug)
