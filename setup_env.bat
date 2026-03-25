@echo off
echo Setting up Backend Environment...
python -m venv backend\venv
call backend\venv\Scripts\activate
pip install -r backend\requirements.txt
call deactivate

echo Setting up AI Service Environment...
python -m venv ai_service\venv
call ai_service\venv\Scripts\activate
pip install -r ai_service\requirements.txt
call deactivate

echo Setup Component!
