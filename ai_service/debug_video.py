import cv2
import os

video_path = "test_safety.mp4"
print(f"Testing video path: {video_path}")
print(f"File exists: {os.path.exists(video_path)}")

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error: Could not open video.")
else:
    print(f"Success! Video opened. FPS: {cap.get(cv2.CAP_PROP_FPS)}")
    ret, frame = cap.read()
    print(f"Read frame result: {ret}")
    if ret:
        print(f"Frame shape: {frame.shape}")
    cap.release()
