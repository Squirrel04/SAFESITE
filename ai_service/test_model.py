import cv2
import time
import os
from dotenv import load_dotenv
from detector import PPE_Detector

# Load env but force source for this test if needed, or use env
load_dotenv()
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "test_video.avi")

output_file = "detections_output.txt"

def main():
    print(f"Starting Test Service. Source: {CAMERA_SOURCE}")
    
    detector = PPE_Detector()
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    
    if not cap.isOpened():
        print(f"Error: Could not open {CAMERA_SOURCE}")
        return

    print(f"Video opened. FPS: {cap.get(cv2.CAP_PROP_FPS)}")
    
    with open(output_file, "w") as f:
        f.write(f"Testing source: {CAMERA_SOURCE}\n")
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                print("End of video or read error.")
                break
            
            frame_count += 1
            
            # Detect
            detections, _ = detector.detect(frame)
            
            # Log
            if detections:
                log_entry = f"Frame {frame_count}: Found {len(detections)} objects: {[d['label'] for d in detections]}"
                print(log_entry)
                f.write(log_entry + "\n")
            else:
                if frame_count % 10 == 0:
                    print(f"Frame {frame_count}: No detections")

    cap.release()
    print(f"Test complete. Results saved to {output_file}")

if __name__ == "__main__":
    main()
