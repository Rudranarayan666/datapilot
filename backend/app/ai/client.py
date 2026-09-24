import os
import json
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

def call_llm_structured(prompt: str, system_prompt: str = "") -> Optional[str]:
    """
    Constrained LLM caller.
    If no key is configured or provider is 'none', returns None safely.
    The app is 100% usable without any API key.
    """
    provider = settings.LLM_PROVIDER.lower()
    api_key = settings.LLM_API_KEY
    
    if not api_key or provider in ["none", ""]:
        return None
        
    try:
        if provider == "openai":
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": settings.LLM_MODEL or "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
            with httpx.Client(timeout=15.0) as client:
                resp = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
                    
        elif provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL or 'gemini-1.5-flash'}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_prompt}\n\n{prompt}"}]}],
                "generationConfig": {"temperature": 0.1}
            }
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"LLM call fallback triggered due to: {e}")
        return None
        
    return None
