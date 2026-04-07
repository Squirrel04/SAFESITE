import os
import openai
from dotenv import load_dotenv

load_dotenv(".env")
api_key = os.getenv("GROK_API_KEY")

client = openai.OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1"
)

models = [
    "grok-3", "grok-3-mini", "grok-3-vision", "grok-3-pro", 
    "grok-2-vision", "grok-2", "grok-1.5-vision", "grok-beta"
]

print("Testing models...")
for m in models:
    try:
        response = client.chat.completions.create(
            model=m,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=1
        )
        print(f"{m}: OK")
    except Exception as e:
        msg = str(e).split(' - ')[-1]
        print(f"{m}: FAIL ({msg})")
