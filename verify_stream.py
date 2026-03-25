import asyncio
import websockets
import time

async def verify():
    uri = "ws://localhost:8000/ws/stream/client/01"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Waiting for frames...")
            # Set a timeout for receiving a frame
            start_time = time.time()
            while time.time() - start_time < 10:
                try:
                    data = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    if isinstance(data, bytes):
                        print(f"Received frame of size {len(data)} bytes")
                        print("Stream verification SUCCESS!")
                        return
                    else:
                        print("Received non-binary data")
                except asyncio.TimeoutError:
                    print("Timeout waiting for frame")
                    break
            print("Stream verification FAILED: No frames received within timeout")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
