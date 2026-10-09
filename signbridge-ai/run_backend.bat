@echo off
echo =======================================================
echo SIGNBRIDGE AI: Starting Python FastAPI Backend Server
echo =======================================================
cd /d "%~dp0"
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
pause
