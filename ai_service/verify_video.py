import cv2
import os

source = "test_video.avi"
print(f"Checking source: {source}")
print(f"File exists: {os.path.exists(source)}")

cap = cv2.VideoCapture(source)
if not cap.isOpened():
    print("Failed to open video capture")
else:
    ret, frame = cap.read()
    if ret:
        print("Successfully read a frame")
        print(f"Frame shape: {frame.shape}")
    else:
        print("Opened but failed to read frame")
    cap.release()
