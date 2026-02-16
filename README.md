# Construction Site Safety Monitor

A comprehensive safety monitoring system using computer vision to detect PPE violations, unsafe zones, and fall risks in real-time.

## Project Structure

- `backend/`: FastAPI application for API and business logic.
- `frontend/`: React application for the dashboard.
- `ai_service/`: Python service running YOLOv8 for object detection.

## Setup

1. **Prerequisites**: Python 3.10+, Node.js 18+.
2. **Install Dependencies**:
   - Run `setup_env.bat` to set up Python environments.
   - Run `cd frontend && npm install` to set up Frontend.

## Running the App

- **Backend**: `backend\venv\Scripts\activate` -> `uvicorn main:app --reload`
- **AI Service**: `ai_service\venv\Scripts\activate` -> `python main.py`
- **Frontend**: `cd frontend` -> `npm run dev`
