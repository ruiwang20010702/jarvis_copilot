import os
import httpx
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_doubao():
    api_key = os.getenv("ARK_API_KEY")
    model = os.getenv("ARK_MODEL", "doubao-seed-1-8-251215")
    base_url = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
    
    print(f"Testing with Model: {model}")
    print(f"Base URL: {base_url}")
    print(f"API Key: {api_key[:10]}...")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    request_body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"
                        }
                    },
                    {
                        "type": "text",
                        "text": "图片主要讲了什么?"
                    }
                ]
            }
        ],
        "stream": False,
        "reasoning_effort": "medium"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{base_url}/chat/completions",
                json=request_body,
                headers=headers
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_doubao())
