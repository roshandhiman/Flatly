import json
import re
import httpx
from typing import Type, TypeVar, Optional, Dict, Any
from pydantic import BaseModel, ValidationError
from app.config import settings

T = TypeVar("T", bound=BaseModel)


def extract_json_block(text: str) -> str:
    """Extracts JSON substring from markdown blocks or raw text."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    
    # Try finding outermost { ... } or [ ... ]
    start_brace = text.find("{")
    end_brace = text.rfind("}")
    if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
        return text[start_brace:end_brace + 1].strip()
        
    start_bracket = text.find("[")
    end_bracket = text.rfind("]")
    if start_bracket != -1 and end_bracket != -1 and end_bracket > start_bracket:
        return text[start_bracket:end_bracket + 1].strip()
        
    return text


class LLMClient:
    """
    Provider-agnostic LLM interface with retry on invalid JSON
    and graceful fallback support.
    Currently defaults to local Ollama (qwen2.5:1.5b), easily swappable via env.
    """
    def __init__(
        self,
        provider: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.provider = provider or settings.LLM_PROVIDER
        self.base_url = (base_url or settings.LLM_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.LLM_API_KEY
        self.model = model or settings.LLM_MODEL
        self.timeout = timeout

    async def _call_ollama(self, prompt: str, schema_json: Optional[str] = None) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")

    async def _call_openai_compatible(self, prompt: str, schema_json: Optional[str] = None) -> str:
        url = f"{self.base_url}/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        retries: int = 2
    ) -> Optional[T]:
        """
        Executes prompt and validates response against Pydantic schema T.
        Retries on invalid JSON or schema errors.
        Returns instance of T or None if LLM is unavailable.
        """
        schema_dict = schema.model_json_schema()
        schema_str = json.dumps(schema_dict, indent=2)
        
        full_prompt = (
            f"{prompt}\n\n"
            f"REQUIRED OUTPUT SCHEMA (JSON):\n"
            f"{schema_str}\n\n"
            f"Return ONLY valid JSON that matches this schema precisely. No extra commentary."
        )

        current_prompt = full_prompt
        for attempt in range(retries + 1):
            try:
                if self.provider == "ollama":
                    raw_text = await self._call_ollama(current_prompt, schema_str)
                else:
                    raw_text = await self._call_openai_compatible(current_prompt, schema_str)
                    
                json_str = extract_json_block(raw_text)
                parsed_data = json.loads(json_str)
                validated = schema.model_validate(parsed_data)
                return validated
            except Exception as e:
                if attempt == retries:
                    # All attempts failed or LLM timed out/unreachable
                    return None
                # Append error message for retry
                current_prompt = (
                    f"{full_prompt}\n\n"
                    f"PREVIOUS ATTEMPT FAILED WITH ERROR: {str(e)}\n"
                    f"Please fix the error and output valid JSON according to schema."
                )
        return None

