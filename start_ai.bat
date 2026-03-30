@echo off
cd ai_service
call venv\Scripts\activate
set CAMERA_SOURCE=testfinal.mp4
python main.py
