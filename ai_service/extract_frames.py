import cv2
import os

VIDEO_PATH = "test_safety.mp4"
OUTPUT_DIR = "dataset/images"

def extract_frames():
    if not os.path.exists(VIDEO_PATH):
        print(f"Error: Video file '{VIDEO_PATH}' not found.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"Error: Could not open video '{VIDEO_PATH}'.")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Video opened. Total frames: {total_frames}")

    count = 0
    saved_count = 0
    interval = 10  # Save every 10th frame to avoid duplicates

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if count % interval == 0:
            frame_name = f"frame_{saved_count:04d}.jpg"
            cv2.imwrite(os.path.join(OUTPUT_DIR, frame_name), frame)
            saved_count += 1
            print(f"Saved {frame_name}", end='\r')

        count += 1

    cap.release()
    print(f"\nExtraction complete. Saved {saved_count} frames to '{OUTPUT_DIR}'.")

if __name__ == "__main__":
    extract_frames()
