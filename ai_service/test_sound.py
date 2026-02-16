import winsound
import time

print("Testing Windows sound...")
try:
    # Play 'SystemHand' (usually an error sound)
    print("Playing SystemHand...")
    winsound.PlaySound("SystemHand", winsound.SND_ALIAS)
    time.sleep(1)
    
    # Play a beep
    print("Playing Beep (1000Hz, 500ms)...")
    winsound.Beep(1000, 500)
    
    print("Sound test complete.")
except Exception as e:
    print(f"Error playing sound: {e}")
