import sys

def check_import(module_name):
    print(f"Checking {module_name}...", end=" ")
    try:
        __import__(module_name)
        print("OK")
        return True
    except ImportError as e:
        print(f"FAIL: {e}")
        return False
    except Exception as e:
        print(f"CRITICAL FAIL: {e}")
        return False

print("--- Environment Verification ---")
print(f"Python: {sys.version}")

results = {}
modules = ["cv2", "numpy", "torch", "torchvision", "ultralytics"]

for mod in modules:
    results[mod] = check_import(mod)

if results["torch"]:
    import torch
    print(f"Torch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    try:
        x = torch.rand(5, 3)
        print(f"Tensor Test: {x.size()}")
    except Exception as e:
        print(f"Tensor Op Fail: {e}")

success = all(results.values())
sys.exit(0 if success else 1)
