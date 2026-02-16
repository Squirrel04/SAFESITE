import shutil
import os
import stat

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

target = "venv"
if os.path.exists(target):
    print(f"Removing {target}...")
    try:
        shutil.rmtree(target, onerror=remove_readonly)
        print("Successfully removed venv")
    except Exception as e:
        print(f"Failed to remove venv: {e}")
else:
    print("venv does not exist")
