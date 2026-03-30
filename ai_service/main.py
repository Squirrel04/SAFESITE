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
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "testfinal.mp4") # Default to test final video

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
import uuid

class SnapshotRecorder:
    def __init__(self, fps=15, pre_roll=2, post_roll=3, camera_id="unknown"):
        self.fps = fps
        self.pre_roll_frames = int(fps * pre_roll)
        self.post_roll_frames = int(fps * post_roll)
        self.buffer = deque(maxlen=self.pre_roll_frames)
        self.recording_frames = []
        self.is_recording = False
        self.frames_left = 0
        self.last_filename = None
        self.camera_id = camera_id

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
        unique_id = str(uuid.uuid4())[:6]
        filename = f"snapshot_{self.camera_id}_{timestamp}_{unique_id}.mp4"
        h, w = self.recording_frames[0].shape[:2]
        
        # 'avc1' corresponds to H.264, which is natively supported by web browsers
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
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
    
    # Initialize recorder ONCE outside loop to maintain state across frames
    cam_id = BACKEND_WS_URL.rstrip('/').split('/')[-1]
    recorder = SnapshotRecorder(camera_id=cam_id, fps=30)

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
                            camera_id_str = BACKEND_WS_URL.rstrip('/').split('/')[-1]
                            async with aiohttp.ClientSession() as session:
                                async with session.get(f"{BACKEND_URL}/cameras/{camera_id_str}/status") as resp:
                                    if resp.status == 200:
                                        status_data = await resp.json()
                                        is_active = status_data.get("active", False)
                                        if detector:
                                            detector.muted_labels = status_data.get("muted_labels", [])
                        except Exception as e:
                            print(f"Failed to check camera status: {e}")
                            is_active = True

                    if not is_active:
                        if cap and cap.isOpened() and CAMERA_SOURCE.isdigit():
                            cap.read()
                        is_violation_active = False
                        await asyncio.sleep(0.5)
                        continue

                    # 6x Speed Simulation: Skip 5 frames between each processed frame
                    for _ in range(5):
                        cap.grab()
                    
                    ret, frame = cap.read()
                    if not ret:
                        if not CAMERA_SOURCE.isdigit() and cap.get(cv2.CAP_PROP_FRAME_COUNT) > 0:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            continue
                        else:
                            print("Failed to grab frame")
                            await asyncio.sleep(1)
                            continue

                    recorder.add_frame(frame)
                    
                    annotated_frame = frame
                    detections = []
                    current_violations = []
                    current_frame_has_violation = False
                    violation_data = None

                    if detector:
                        try:
                            detections, annotated_frame = detector.detect(frame)
                            
                            # Gather ALL distinct violations in the current frame safely
                            for d in detections:
                                if d.get("status") == "violation":
                                    current_violations.append(d)
                        except Exception as e:
                            print(f"Detection failed: {e}")

                    # Logic: Generate distinct alerts for multiple simultaneous violations
                    if current_violations:
                        import threading
                        import winsound
                        
                        img_saved = False
                        camera_id_str = BACKEND_WS_URL.rstrip('/').split('/')[-1]
                        unique_id = str(uuid.uuid4())[:6]
                        temp_img_name = f"alert_still_{camera_id_str}_{int(time.time())}_{unique_id}.jpg"
                        
                        for v in current_violations:
                            label = v['label']
                            
                            # Persistently attach last_alert_time tracking directly to the detector object
                            if not hasattr(detector, 'last_alert_time'):
                                detector.last_alert_time = {}
                            
                            # Imposing a 10.0 second cooldown to prevent DB spam per identical violation class
                            if time.time() - detector.last_alert_time.get(label, 0) > 10.0:
                                print(f"New multi-class violation detected: {label}. Triggering distinct alert!.")
                                detector.last_alert_time[label] = time.time()
                                
                                # Play beep async (Once)
                                def play_alarm():
                                    try:
                                        winsound.Beep(1000, 500)
                                    except Exception:
                                        pass
                                threading.Thread(target=play_alarm, daemon=True).start()

                                # Validate we only overwrite/save the primary snapshot frame once per batch
                                if not img_saved:
                                    cv2.imwrite(temp_img_name, annotated_frame)
                                    img_saved = True
                                    recorder.start_recording()
                                
                                alert_payload = {
                                    "camera_id": camera_id_str,
                                    "alert_type": label.split(':')[0],
                                    "message": f"Detected: {label}",
                                    "severity": "high",
                                    "temp_image_path": temp_img_name,
                                    "source": v.get("source", "YOLO"),
                                    "confidence": v.get("confidence", 0.0),
                                    "reasoning": v.get("reasoning", None)
                                }
                                asyncio.create_task(send_alert_async(alert_payload, recorder))

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

                    # Optimized for maximum hardware throughput
                    await asyncio.sleep(0.001)

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
