import psutil
import os
import signal

def cleanup():
    current_pid = os.getpid()
    print(f"Current PID: {current_pid}")
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] == 'python.exe' and proc.info['pid'] != current_pid:
                cmdline = proc.info.get('cmdline', [])
                if cmdline:
                    cmd_str = " ".join(cmdline).lower()
                    if 'main.py' in cmd_str and 'ai_service' in cmd_str:
                        print(f"Killing AI service process: {proc.info['pid']} ({cmd_str})")
                        proc.kill()
                    elif 'uvicorn' in cmd_str and 'backend' in cmd_str:
                        print(f"Killing Backend process: {proc.info['pid']} ({cmd_str})")
                        proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

if __name__ == "__main__":
    cleanup()
