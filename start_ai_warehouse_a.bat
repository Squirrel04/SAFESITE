@echo off
cd ai_service
call venv\Scripts\activate
set CAMERA_SOURCE=C:\Users\DELNA\Downloads\PixVerse_V5.6_Image_Text_360P_create_a_real_ti.mp4
set BACKEND_WS_URL=ws://localhost:8000/ws/stream/upload/02
python main.py
