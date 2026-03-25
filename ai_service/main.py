import os
# Set environment variable to fix potential OpenMP conflicts (WinError 1114)
# This MUST be done before importing torch/ultralytics
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import cv2
import time
import requests

from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "test_safety.mp4") # Default to test video

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
import aiohttp

import aiohttp
from collections import deque

class SnapshotRecorder:
    def __init__(self, fps=15, pre_roll=2, post_roll=3):
        self.fps = fps
        self.pre_roll_frames = int(fps * pre_roll)
        self.post_roll_frames = int(fps * post_roll)
        self.buffer = deque(maxlen=self.pre_roll_frames)
        self.recording_frames = []
        self.is_recording = False
        self.frames_left = 0
        self.last_filename = None

    def add_frame(self, frame):
        if not self.is_recording:
            self.buffer.append(frame.copy())
        else:
            self.recording_frames.append(frame.copy())
            self.frames_left -= 1
            if self.frames_left <= 0:
                self.save_recording()

    def start_recording(self):
        if not self.is_recording:
            self.is_recording = True
            self.recording_frames = list(self.buffer)
            self.frames_left = self.post_roll_frames

    def save_recording(self):
        self.is_recording = False
        if not self.recording_frames: return
        
        timestamp = int(time.time())
        filename = f"snapshot_{timestamp}.mp4"
        h, w = self.recording_frames[0].shape[:2]
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(filename, fourcc, self.fps, (w, h))
        for f in self.recording_frames:
            out.write(f)
        out.release()
        self.last_filename = filename
        print(f"Snapshot saved: {filename}")
        self.recording_frames = []

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
                last_status_check = 0
                last_fps_log = 0
                is_active = False

                while True:
                    if not cap or not cap.isOpened():
                         # Try to reopen or just break to restart outer loop
                         print("Camera disconnected, retrying...")
                         cap = open_camera(CAMERA_SOURCE)
                         if not cap:
                             await asyncio.sleep(5)
                             continue

                    current_time = time.time()
                    if current_time - last_status_check > 2.0:
                        last_status_check = current_time
                        try:
                            camera_id = BACKEND_WS_URL.rstrip('/').split('/')[-1]
                            async with aiohttp.ClientSession() as session:
                                async with session.get(f"{BACKEND_URL}/cameras/{camera_id}/status") as resp:
                                    if resp.status == 200:
                                        status_data = await resp.json()
                                        is_active = status_data.get("active", False)
                        except Exception as e:
                            print(f"Failed to check camera status: {e}")
                            is_active = True

                    if not is_active:
                        if cap and cap.isOpened() and CAMERA_SOURCE.isdigit():
                            cap.read()
                        is_violation_active = False
                        await asyncio.sleep(0.5)
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
                    recorder = locals().get('recorder')
                    if recorder is None:
                        recorder = SnapshotRecorder()
                        locals()['recorder'] = recorder
                    
                    recorder.add_frame(frame)
                    
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

                            # Save temporary high-quality image for storage
                            temp_img_name = f"alert_still_{int(time.time())}.jpg"
                            cv2.imwrite(temp_img_name, annotated_frame)

                            # Trigger Snapshot
                            recorder.start_recording()
                            
                            alert_payload = {
                                "camera_id": "01",
                                "alert_type": violation_data['label'].split(':')[0],
                                "message": f"Detected: {violation_data['label']}",
                                "severity": "high",
                                "temp_image_path": temp_img_name # This will be handled in send_alert_async
                            }
                            asyncio.create_task(send_alert_async(alert_payload, recorder))
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

                    # Performance check
                    process_time = time.time() - current_time
                    fps = 1.0 / process_time if process_time > 0 else 0
                    if current_time - last_fps_log > 2.0: # Log every 2 seconds
                        last_fps_log = current_time
                        print(f"Streaming at {fps:.2f} FPS (Process time: {process_time*1000:.1f}ms per frame)")

                    await asyncio.sleep(max(0, 0.06 - process_time)) # Target ~15 FPS (more stable)

        except (websockets.exceptions.ConnectionClosed, ConnectionRefusedError) as e:
            print(f"Connection lost or refused: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Unexpected error: {e}")
            await asyncio.sleep(5)

    if cap:
        cap.release()

import aiohttp

async def send_alert_async(alert_data, recorder=None):
    try:
        async with aiohttp.ClientSession() as session:
            # 1. Upload Static Image first if provided as local path
            if 'temp_image_path' in alert_data:
                img_path = alert_data.pop('temp_image_path')
                with open(img_path, 'rb') as f:
                    form = aiohttp.FormData()
                    form.add_field('file', f, filename=os.path.basename(img_path))
                    async with session.post(f"{BACKEND_URL}/alerts/upload-evidence", data=form) as img_resp:
                        if img_resp.status == 200:
                            img_data = await img_resp.json()
                            alert_data['image_url'] = f"{BACKEND_URL}{img_data.get('url')}"
                try: os.remove(img_path) 
                except: pass

            # 2. Create Alert
            async with session.post(f"{BACKEND_URL}/alerts/", json=alert_data) as resp:
                if resp.status == 200:
                    alert_result = await resp.json()
                    alert_id = alert_result.get("id")
                    print(f"Alert created: {alert_id}")
                    
                    # 3. Wait for recorder to finish and upload video
                    if recorder and alert_id:
                        while recorder.is_recording:
                            await asyncio.sleep(0.5)
                        
                        if recorder.last_filename:
                            video_file = recorder.last_filename
                            with open(video_file, 'rb') as f:
                                form = aiohttp.FormData()
                                form.add_field('file', f, filename=video_file)
                                async with session.post(f"{BACKEND_URL}/alerts/upload-evidence", data=form) as upload_resp:
                                    if upload_resp.status == 200:
                                        upload_data = await upload_resp.json()
                                        video_url = f"{BACKEND_URL}{upload_data.get('url')}"
                                        
                                        # 4. PATCH Alert with video_url
                                        patch_data = {"video_url": video_url}
                                        async with session.patch(f"{BACKEND_URL}/alerts/{alert_id}", json=patch_data) as patch_resp:
                                            if patch_resp.status == 200:
                                                print(f"Video evidence associated: {video_url}")
                                            else:
                                                print(f"Failed to patch alert: {patch_resp.status}")
                else:
                    print(f"Failed to send alert: {resp.status}")
    except Exception as e:
        print(f"Failed to send alert: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(stream_frames())
    except KeyboardInterrupt:
        print("Stopping AI Service...")
