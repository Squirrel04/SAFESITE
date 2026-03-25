@echo off
echo Starting SafeSite System...

echo Starting Backend...
start "SafeSite Backend" cmd /k ".\start_backend.bat"

echo Starting Frontend...
start "SafeSite Frontend" cmd /k ".\start_frontend.bat"

echo Starting AI Service...
start "SafeSite AI Service" cmd /k ".\start_ai.bat"

echo All services started. 
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
