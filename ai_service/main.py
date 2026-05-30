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
        import threading
        self.lock = threading.Lock()
        self.associated_alert_ids = []

    def register_alert_for_video(self, alert_id):
        if not alert_id: return
        with self.lock:
            if alert_id not in self.associated_alert_ids:
                self.associated_alert_ids.append(alert_id)
                print(f"Registered alert ID {alert_id} for active recording.")

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
            with self.lock:
                self.associated_alert_ids = []
            self.recording_frames = list(self.buffer)
            self.frames_left = self.post_roll_frames

    def save_recording(self):
        self.is_recording = False
        if not self.recording_frames: return
        
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:6]
        filename = f"snapshot_{self.camera_id}_{timestamp}_{unique_id}.mp4"
        h, w = self.recording_frames[0].shape[:2]
        
        # Try H.264 (avc1) first
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(filename, fourcc, self.fps, (w, h))
        
        if not out.isOpened():
            print("Warning: H.264 (avc1) codec is not available. Falling back to MPEG-4 (mp4v)...")
            out.release()
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(filename, fourcc, self.fps, (w, h))
            
            if not out.isOpened():
                print("Warning: MPEG-4 (mp4v) codec failed. Falling back to Motion JPEG (MJPG)...")
                out.release()
                fourcc = cv2.VideoWriter_fourcc(*'MJPG')
                out = cv2.VideoWriter(filename, fourcc, self.fps, (w, h))
                
        for f in self.recording_frames:
            out.write(f)
        out.release()
        self.last_filename = filename
        print(f"Snapshot saved: {filename}")
        self.recording_frames = []
        
        # Spawn asynchronous video uploader task
        with self.lock:
            alert_ids_copy = list(self.associated_alert_ids)
            self.associated_alert_ids = []
            
        asyncio.create_task(self.upload_recording_async(filename, alert_ids_copy))

    async def upload_recording_async(self, filename, alert_ids):
        if not alert_ids:
            print(f"No alerts associated with {filename}. Deleting local file.")
            try: os.remove(filename)
            except: pass
            return
            
        print(f"Uploading video evidence {filename} for alerts: {alert_ids}")
        try:
            async with aiohttp.ClientSession() as session:
                with open(filename, 'rb') as f:
                    form = aiohttp.FormData()
                    form.add_field('file', f, filename=filename)
                    async with session.post(f"{BACKEND_URL}/alerts/upload-evidence", data=form) as upload_resp:
                        if upload_resp.status == 200:
                            upload_data = await upload_resp.json()
                            video_url = f"{BACKEND_URL}{upload_data.get('url')}"
                            print(f"Uploaded video successfully. URL: {video_url}. Patching {len(alert_ids)} alerts...")
                            
                            # Patch all registered alerts
                            for alert_id in alert_ids:
                                patch_data = {"video_url": video_url}
                                async with session.patch(f"{BACKEND_URL}/alerts/{alert_id}", json=patch_data) as patch_resp:
                                    if patch_resp.status == 200:
                                        print(f"Successfully patched alert {alert_id} with video URL.")
                                    else:
                                        print(f"Failed to patch alert {alert_id}: status {patch_resp.status}")
                        else:
                            print(f"Failed to upload video {filename}: status {upload_resp.status}")
        except Exception as e:
            print(f"Error during video upload/association for {filename}: {e}")
        finally:
            # Delete local file to conserve space
            try: os.remove(filename)
            except Exception as e:
                print(f"Could not delete local file {filename}: {e}")

def draw_premium_hud(frame, detections, scale_x=1.0, scale_y=1.0, is_high_res=False):
    """
    Renders high-clarity, modern, HUD-style bounding boxes onto the frame.
    If is_high_res is True, scales brackets and fonts appropriately for a 1080p canvas.
    """
    import numpy as np
    h_orig, w_orig = frame.shape[:2]
    
    # ── DRAW VIRTUAL DANGER ZONE FOR CAMERA 01 ──────────────────────────────
    camera_id = BACKEND_WS_URL.rstrip('/').split('/')[-1]
    if camera_id == "01":
        COLOR_ZONE = (220, 0, 220)  # Violet
        dz_xmin, dz_ymin, dz_xmax, dz_ymax = 0.0, 0.40, 0.45, 1.0
        
        pts = np.array([
            [dz_xmin * w_orig, dz_ymin * h_orig],
            [dz_xmax * w_orig, dz_ymin * h_orig],
            [dz_xmax * w_orig, dz_ymax * h_orig],
            [dz_xmin * w_orig, dz_ymax * h_orig]
        ], dtype=np.int32)
        
        # 1. Semi-transparent filled overlay (5% opacity)
        try:
            overlay = frame.copy()
            cv2.fillPoly(overlay, [pts], COLOR_ZONE)
            cv2.addWeighted(overlay, 0.05, frame, 0.95, 0, frame)
        except Exception:
            pass
            
        # 2. Draw solid boundary border
        cv2.polylines(frame, [pts], isClosed=True, color=COLOR_ZONE, thickness=2, lineType=cv2.LINE_AA)
        
        # 3. Text label for the zone
        ui_scale = 3.0 if is_high_res else 1.0
        font_scale = 0.42 * ui_scale
        label_x = int(0.01 * w_orig)
        label_y = int(dz_ymin * h_orig - (8 * ui_scale))
        if label_y < 12: label_y = 12
        cv2.putText(frame, "DANGER ZONE: CAMERA 01 (RESTRICTED AREA)", (label_x, label_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, COLOR_ZONE, 1, cv2.LINE_AA)
    
    for d in detections:
        # Scale bounding box coordinates
        x1 = int(d["box"][0] * scale_x)
        y1 = int(d["box"][1] * scale_y)
        x2 = int(d["box"][2] * scale_x)
        y2 = int(d["box"][3] * scale_y)
        
        # Clip to frame boundaries
        x1 = max(0, min(w_orig - 1, x1))
        y1 = max(0, min(h_orig - 1, y1))
        x2 = max(0, min(w_orig - 1, x2))
        y2 = max(0, min(h_orig - 1, y2))
        
        if x2 <= x1 or y2 <= y1:
            continue
            
        # Get color
        color = d.get("color", (0, 0, 255) if d["status"] == "violation" else (0, 255, 0))
        
        # Adjust scale factors for UI drawing
        ui_scale = 3.0 if is_high_res else 1.0
        
        # 1. Semi-transparent filled overlay (10% opacity)
        try:
            overlay = frame[y1:y2, x1:x2].copy()
            overlay_filled = np.full(overlay.shape, color, dtype=np.uint8)
            overlay_blended = cv2.addWeighted(overlay, 0.90, overlay_filled, 0.10, 0)
            frame[y1:y2, x1:x2] = overlay_blended
        except Exception:
            pass # Fallback in case of out of bounds or empty slice
            
        # 2. Thin bounding box border
        t_border = 2 if is_high_res else 1
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, t_border)
        
        # 3. Premium corner brackets
        corner_len = int(12 * ui_scale)
        t_thick = int(2.5 * ui_scale)
        if t_thick < 1: t_thick = 1
        
        # Top-Left Corner
        cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, t_thick)
        cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, t_thick)
        # Top-Right Corner
        cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, t_thick)
        cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, t_thick)
        # Bottom-Left Corner
        cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, t_thick)
        cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, t_thick)
        # Bottom-Right Corner
        cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, t_thick)
        cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, t_thick)
        
        # 4. Text Pill
        display_text = f"{d['label']} {d['confidence']:.2f}"
        font_scale = 0.38 * ui_scale
        t_text = 2 if is_high_res else 1
        (tw, th), _ = cv2.getTextSize(display_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, t_text)
        
        ty = y1 - int(4 * ui_scale)
        if ty - th - 4 < 0:
            ty = y1 + th + int(4 * ui_scale)
            
        cv2.rectangle(frame, (x1, ty - th - int(4 * ui_scale)), (x1 + tw + int(6 * ui_scale), ty + int(2 * ui_scale)), color, -1)
        cv2.putText(frame, display_text, (x1 + int(3 * ui_scale), ty - int(1 * ui_scale)), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), t_text, cv2.LINE_AA)

BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://localhost:8000/ws/stream/upload/01") # Default cam ID 01

async def stream_frames():
    print(f"Starting AI Service. Configured source: {CAMERA_SOURCE}")
    
    try:
        from detector import PPE_Detector
        detector = PPE_Detector()
    except Exception as e:
        print(f"Warning: Failed to initialize detector: {e}")
        detector = None

    import threading
    import winsound

    camera_id_str = BACKEND_WS_URL.rstrip('/').split('/')[-1]
    latest_detections = []
    inference_frame = None
    
    def inference_worker():
        nonlocal latest_detections, inference_frame
        while True:
            if inference_frame is not None and detector is not None:
                frame_to_process = inference_frame.copy()
                inference_frame = None
                try:
                    dets, _ = detector.detect(frame_to_process, camera_id=camera_id_str)
                    latest_detections = dets
                except Exception as e:
                    print(f"Inference error: {e}")
            else:
                time.sleep(0.01)

    threading.Thread(target=inference_worker, daemon=True).start()

    # Throttled status checking in background task to avoid periodic stutters
    status_state = {
        "is_active": True,
        "muted_labels": []
    }

    async def update_status_loop():
        nonlocal status_state
        camera_id_str = BACKEND_WS_URL.rstrip('/').split('/')[-1]
        while True:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{BACKEND_URL}/cameras/{camera_id_str}/status") as resp:
                        if resp.status == 200:
                            status_data = await resp.json()
                            status_state["is_active"] = status_data.get("active", False)
                            status_state["muted_labels"] = status_data.get("muted_labels", [])
                            if detector:
                                detector.muted_labels = status_state["muted_labels"]
            except Exception as e:
                # If backend is not available, default to active
                status_state["is_active"] = True
            await asyncio.sleep(2.0)

    asyncio.create_task(update_status_loop())

    cap = open_camera(CAMERA_SOURCE)
    
    source_fps = 30
    if cap and cap.isOpened():
        prop_fps = cap.get(cv2.CAP_PROP_FPS)
        if prop_fps > 0:
            source_fps = prop_fps
            print(f"Detected input source FPS: {source_fps}")
            
    # Initialize recorder ONCE outside loop to maintain state across frames
    cam_id = BACKEND_WS_URL.rstrip('/').split('/')[-1]
    recorder = SnapshotRecorder(camera_id=cam_id, fps=source_fps)

    # State for tracking violation persistence
    is_violation_active = False

    last_inference_time = 0
    inference_cooldown = 0.15  # Max ~6.6 FPS for YOLO inference, plenty for safety monitoring and frees the GIL

    # Retry connection loop
    while True:
        try:
            async with websockets.connect(BACKEND_WS_URL) as websocket:
                print(f"Connected to backend at {BACKEND_WS_URL}")
                last_fps_log = 0
                stream_start_time = time.time()
                frame_idx = 0

                while True:
                    if not cap or not cap.isOpened():
                         # Try to reopen or just break to restart outer loop
                         print("Camera disconnected, retrying...")
                         cap = open_camera(CAMERA_SOURCE)
                         if not cap:
                             await asyncio.sleep(5)
                             continue
                         else:
                             prop_fps = cap.get(cv2.CAP_PROP_FPS)
                             if prop_fps > 0:
                                 source_fps = prop_fps
                                 recorder.fps = source_fps
                             stream_start_time = time.time()
                             frame_idx = 0

                    current_time = time.time()
                    
                    if not status_state["is_active"]:
                        if cap and cap.isOpened() and CAMERA_SOURCE.isdigit():
                            cap.read()
                        is_violation_active = False
                        await asyncio.sleep(0.5)
                        # Reset timing after inactive period
                        stream_start_time = time.time()
                        frame_idx = 0
                        continue

                    # Real-time processing: process every frame for smooth video and realistic evidence
                    ret, frame = cap.read()
                    if not ret:
                        if not CAMERA_SOURCE.isdigit() and cap.get(cv2.CAP_PROP_FRAME_COUNT) > 0:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            stream_start_time = time.time()
                            frame_idx = 0
                            continue
                        else:
                            print("Failed to grab frame")
                            await asyncio.sleep(1)
                            continue

                    # Submit to inference only at a controlled rate (keeps frame rate high and smooth)
                    if detector and inference_frame is None and (current_time - last_inference_time) > inference_cooldown:
                        inference_frame = frame.copy()
                        last_inference_time = current_time
                        
                    # Determine active and violation detections
                    current_violations = []
                    active_detections = []
                    
                    for d in latest_detections:
                        if d.get("label") not in getattr(detector, 'muted_labels', []):
                            active_detections.append(d)
                            if d.get("status") == "violation":
                                current_violations.append(d)

                    # Create a high-resolution annotated frame for the evidence recording
                    recorded_frame = frame.copy()
                    draw_premium_hud(recorded_frame, active_detections, scale_x=1.0, scale_y=1.0, is_high_res=True)
                    recorder.add_frame(recorded_frame)

                    # Resize raw frame to 360p first for stream
                    stream_frame = cv2.resize(frame, (640, 360))
                    h_orig, w_orig = frame.shape[:2]
                    scale_x = 640.0 / w_orig
                    scale_y = 360.0 / h_orig
                    draw_premium_hud(stream_frame, active_detections, scale_x=scale_x, scale_y=scale_y, is_high_res=False)

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
                                
                                violation_type = v.get("violation_type", "ppe")
                                
                                # Play beep async (Once) only for PPE violations
                                if violation_type == "ppe":
                                    def play_alarm():
                                        try:
                                            winsound.Beep(1000, 500)
                                        except Exception:
                                            pass
                                    threading.Thread(target=play_alarm, daemon=True).start()

                                # Validate we only overwrite/save the primary snapshot frame once per batch
                                if not img_saved:
                                    high_res_alert = frame.copy()
                                    draw_premium_hud(high_res_alert, active_detections, scale_x=1.0, scale_y=1.0, is_high_res=True)
                                    cv2.imwrite(temp_img_name, high_res_alert, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
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

                    # Encode frame to JPEG with high quality (80)
                    options = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
                    ret, buffer = cv2.imencode('.jpg', stream_frame, options)
                    
                    if ret:
                        # Send frame bytes
                        await websocket.send(buffer.tobytes())
                        
                        # TODO: Could also send detection metadata as text/json in a separate channel or interleaved?
                        # For now, just streaming the annotated video.

                    frame_idx += 1

                    # Performance check
                    process_time = time.time() - current_time
                    fps = 1.0 / process_time if process_time > 0 else 0
                    if current_time - last_fps_log > 2.0: # Log every 2 seconds
                        last_fps_log = current_time
                        print(f"Streaming at {fps:.2f} FPS (Process time: {process_time*1000:.1f}ms per frame)")

                    # Match input video frame rate precisely with smooth relative pacing
                    process_time = time.time() - current_time
                    target_delay = 1.0 / source_fps if source_fps > 0 else 0.040
                    sleep_time = target_delay - process_time
                    
                    if sleep_time > 0:
                        await asyncio.sleep(sleep_time)
                    else:
                        # Yield to the event loop so other async tasks run smoothly
                        await asyncio.sleep(0.005)

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
                    
                    # 3. Register alert with recorder for centralized upload and patching
                    if recorder and alert_id:
                        recorder.register_alert_for_video(alert_id)
                else:
                    print(f"Failed to send alert: {resp.status}")
    except Exception as e:
        print(f"Failed to send alert: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(stream_frames())
    except KeyboardInterrupt:
        print("Stopping AI Service...")
