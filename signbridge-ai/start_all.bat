@echo off
echo =======================================================
echo SIGNBRIDGE AI: Starting Full Platform (Backend + Frontend)
echo =======================================================
start "SIGNBRIDGE AI Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload"
start "SIGNBRIDGE AI Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"
echo Both services launched in separate windows!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
pause
