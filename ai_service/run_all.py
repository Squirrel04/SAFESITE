import subprocess
import time
import os
import sys

def launch_camera(source, cam_id):
    env = os.environ.copy()
    env["CAMERA_SOURCE"] = source
    env["BACKEND_WS_URL"] = f"ws://localhost:8000/ws/stream/upload/{cam_id}"
    env["PYTHONUNBUFFERED"] = "1"
    print(f"Launching Camera {cam_id} using source {source}...")
    
    return subprocess.Popen(
        [sys.executable, "-u", "main.py"],
        env=env
    )

if __name__ == "__main__":
    processes = []
    try:
        p1 = launch_camera("test.mp4", "01")
        processes.append(p1)

        print("Camera launched. Press Ctrl+C to stop.")

        for p in processes:
            p.wait()

    except KeyboardInterrupt:
        print("\nStopping camera...")
        for p in processes:
            p.terminate()
            p.wait()
        print("Camera stopped.")
