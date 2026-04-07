import cv2
import json
import base64
import os
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(".env")
api_key = os.getenv("GROK_API_KEY")

if not api_key:
    print("GROK_API_KEY not found!")
    exit(1)

client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)
model_name = "grok-3-mini"

def test_frame(cap, frame_idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    
    if not ret:
        print(f"Frame {frame_idx}: Could not read frame.")
        return False
        
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    img_b64 = base64.b64encode(buffer).decode('utf-8')
    prompt = (
        "You are a strict industrial safety AI monitoring a live CCTV feed. "
        "Analyze the scene carefully for the following critical violations: "
        "1. Missing PPE (Helmet, Vest, Harness). "
        "2. Unauthorized Zone: Person within restricted red-taped areas or fenced construction zones. "
        "3. Unsafe activity: Smoking, Cell Phone/Headphone usage in active vehicle zones. "
        "4. Fall Risks: Person near unprotected edges, climbing without harness. "
        "5. Danger Zone: Person near active excavator buckets, under heavy suspended loads, or within swing radius of moving machinery. (CRITICAL) "
        "6. Health/Emergency: A person lying on the floor (potential fall/injury/unresponsive). "
        "7. Fire/Smoke: Large plumes signifying fire (distinguish from dust). "
        "Respond ONLY with a valid JSON array of violation objects. Each object MUST have: "
        "\"label\": concise string e.g. 'Smoking', 'Phone Usage', 'Fall Risk', 'Danger Zone Alert', 'No Helmet', 'Injury Risk', 'Fire'. "
        "\"confidence\": float 0.0-1.0. "
        "\"reasoning\": one-sentence technical explanation. "
        "\"recommendation\": short remedial action. "
        "\"box_2d\": [ymin, xmin, ymax, xmax] scaled 0 to 1000. "
        "If scene is safe, respond with exactly: []"
    )
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_b64}",
                            "detail": "high"
                        }
                    },
                    {"type": "text", "text": prompt}
                ]
            }
        ],
        temperature=0.1,
        max_tokens=1024,
    )
    
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    
    print(f"--- FRAME {frame_idx} RESULT ---")
    print(raw)
    
    # Save the frame for reference
    cv2.imwrite(f"eval_frame_{frame_idx}.jpg", frame)
    return True

def main():
    cap = cv2.VideoCapture("testfinal.mp4")
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames: {total_frames}")
    
    for idx in range(100, total_frames, 300):
        print(f"Evaluating frame {idx}...")
        test_frame(cap, idx)
        time.sleep(1.5)

if __name__ == "__main__":
    main()
