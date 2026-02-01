"""
Unified LLM Client with Pydantic validation.
Supports Ollama and OpenAI providers.
"""

import json
from typing import Type, TypeVar

import requests
from pydantic import BaseModel, ValidationError

# Import config from parent package (scripts/)
from config import (
    OLLAMA_URL,
    OLLAMA_MODEL,
    OPENAI_API_KEY,
    OPENAI_MODEL,
)
from .logger import Logger

T = TypeVar("T", bound=BaseModel)


class LLMClient:
    """Unified LLM client with Pydantic response validation."""

    def __init__(self, provider: str = "ollama"):
        self.provider = provider
        self.log = Logger("llm_client")
        if provider == "openai" and not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set in environment")

    @property
    def model_name(self) -> str:
        return OPENAI_MODEL if self.provider == "openai" else OLLAMA_MODEL

    def extract(
        self,
        prompt: str,
        response_model: Type[T],
        max_retries: int = 2,
    ) -> T:
        """
        Send prompt to LLM and validate response against Pydantic model.
        
        Args:
            prompt: The full prompt to send
            response_model: Pydantic model class for validation
            max_retries: Number of retries on validation failure
        
        Returns:
            Validated Pydantic model instance
        """
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                if self.provider == "openai":
                    raw_response = self._call_openai(prompt)
                else:
                    raw_response = self._call_ollama(prompt)

                return response_model.model_validate(raw_response)

            except (ValidationError, ValueError) as e:
                last_error = e
                # self.log.warning(f"Validation failed: {e}") 
                # Reduced noise: only log if debug is on or it's a critical failure later
                if attempt < max_retries:
                    continue
                raise ValueError(
                    f"LLM response validation failed after {max_retries + 1} attempts: {e}"
                ) from e

            except json.JSONDecodeError as e:
                last_error = e
                self.log.warning(f"JSON Decode failed: {e}")
                if attempt < max_retries:
                    self.log.info("Retrying...")
                    continue
                raise ValueError(f"LLM returned invalid JSON: {e}") from e

    def _call_ollama(self, prompt: str) -> dict:
        """Call Ollama API."""
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=600,
        )
        response.raise_for_status()
        return json.loads(response.json()["response"])

    def _call_openai(self, prompt: str) -> dict:
        """Call OpenAI API."""
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a data extraction expert."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            timeout=120,
        )

        return json.loads(response.choices[0].message.content)
