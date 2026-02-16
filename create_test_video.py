import cv2
import numpy as np

def create_video():
    width, height = 640, 480
    fps = 30
    seconds = 5
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    out = cv2.VideoWriter('test_video.avi', fourcc, fps, (width, height))
    
    for i in range(fps * seconds):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Bouncing box animation
        x = (i * 5) % width
        y = (i * 5) % height
        cv2.rectangle(frame, (x, 200), (x+50, 250), (0, 255, 0), -1)
        cv2.putText(frame, f"Frame {i}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        out.write(frame)
    
    out.release()
    print("Created test_video.avi")

if __name__ == "__main__":
    create_video()
