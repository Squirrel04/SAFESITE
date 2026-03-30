@echo off
cd ai_service
call venv\Scripts\activate
set CAMERA_SOURCE=testfinal.mp4
set BACKEND_WS_URL=ws://localhost:8000/ws/stream/upload/02
python main.py
