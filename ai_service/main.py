import cv2
import time
import requests
import os
# Set environment variable to fix potential OpenMP conflicts (WinError 1114)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "test_video.avi") # Default to webcam

def open_camera(source):
    """Attempt to open a camera source with fallback strategies."""
    cap = None
    if source.isdigit():
        idx = int(source)
        if os.name == 'nt':
            # Try DirectShow first on Windows
            print(f"Trying camera index {idx} with CAP_DSHOW...")
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if cap.isOpened(): return cap
        
        # Fallback to default backend
        print(f"Trying camera index {idx} with default backend...")
        cap = cv2.VideoCapture(idx)
        if cap.isOpened(): return cap
    else:
        # File or URL
        print(f"Trying source {source}...")
        cap = cv2.VideoCapture(source)
        if cap.isOpened(): return cap
        
    return None

import asyncio
import websockets
import json

BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://localhost:8000/ws/stream/upload/01") # Default cam ID 01

async def stream_frames():
    print(f"Starting AI Service. Configured source: {CAMERA_SOURCE}")
    
    try:
        from detector import PPE_Detector
        detector = PPE_Detector()
    except Exception as e:
        print(f"Warning: Failed to initialize detector: {e}")
        detector = None

    cap = open_camera(CAMERA_SOURCE)
    
    # State for tracking violation persistence
    is_violation_active = False

    # Retry connection loop
    while True:
        try:
            async with websockets.connect(BACKEND_WS_URL) as websocket:
                print(f"Connected to backend at {BACKEND_WS_URL}")
                
                while True:
                    if not cap or not cap.isOpened():
                         # Try to reopen or just break to restart outer loop
                         print("Camera disconnected, retrying...")
                         cap = open_camera(CAMERA_SOURCE)
                         if not cap:
                             await asyncio.sleep(5)
                             continue

                    ret, frame = cap.read()
                    if not ret:
                        if not CAMERA_SOURCE.isdigit() and cap.get(cv2.CAP_PROP_FRAME_COUNT) > 0:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            continue
                        else:
                            print("Failed to grab frame")
                            await asyncio.sleep(1)
                            continue

                    # Detection
                    annotated_frame = frame
                    detections = []
                    current_frame_has_violation = False
                    violation_data = None

                    if detector:
                        try:
                            detections, annotated_frame = detector.detect(frame)
                            
                            # Check for violations
                            for d in detections:
                                if d.get("status") == "violation":
                                    current_frame_has_violation = True
                                    violation_data = d
                                    break # Found a violation, that's enough for status
                        except Exception as e:
                            print(f"Detection failed: {e}")

                    # Logic: Play alert ONLY on rising edge (False -> True)
                    # "OFF THE ALERT SOUND AFTER ONE BEEP IF NO VIOLATION IS SEEN"
                    if current_frame_has_violation:
                        if not is_violation_active:
                            # Rising Edge: New violation episode detected
                            print("Violation detected! Triggering alert.")
                            is_violation_active = True
                            
                            # Play beep async (Once)
                            import threading
                            import winsound
                            
                            def play_alarm():
                                try:
                                    # 1000 Hz, 500 ms
                                    winsound.Beep(1000, 500)
                                except Exception:
                                    pass
                            
                            threading.Thread(target=play_alarm, daemon=True).start()

                            # Encode frame to Base64 for storage
                            import base64
                            _, buffer = cv2.imencode('.jpg', annotated_frame)
                            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                            base64_image = f"data:image/jpeg;base64,{jpg_as_text}"

                            # Send Alert
                            alert_payload = {
                                "camera_id": "01",
                                "alert_type": "PPE Violation",
                                "message": f"Detected: {violation_data['label']}",
                                "severity": "high",
                                "image_url": base64_image
                            }
                            asyncio.create_task(send_alert_async(alert_payload))
                    else:
                        # Falling Edge: Violation cleared
                        if is_violation_active:
                            print("Violation cleared. Resetting alert state.")
                            is_violation_active = False

                    # Encode frame to JPEG
                    options = [int(cv2.IMWRITE_JPEG_QUALITY), 70] # Lower quality for speed
                    ret, buffer = cv2.imencode('.jpg', annotated_frame, options)
                    
                    if ret:
                        # Send frame bytes
                        await websocket.send(buffer.tobytes())
                        
                        # TODO: Could also send detection metadata as text/json in a separate channel or interleaved?
                        # For now, just streaming the annotated video.

                    await asyncio.sleep(0.03) # Cap at ~30 FPS

        except (websockets.exceptions.ConnectionClosed, ConnectionRefusedError) as e:
            print(f"Connection lost or refused: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Unexpected error: {e}")
            await asyncio.sleep(5)

    if cap:
        cap.release()

import aiohttp

async def send_alert_async(alert_data):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{BACKEND_URL}/alerts/", json=alert_data) as resp:
                if resp.status != 200:
                    print(f"Failed to send alert: {resp.status}")
    except Exception as e:
        print(f"Failed to send alert: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(stream_frames())
    except KeyboardInterrupt:
        print("Stopping AI Service...")
