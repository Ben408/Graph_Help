import json
import re
from time import monotonic, sleep
from typing import Protocol, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from src.llm.schema import ollama_compatible_schema

StructuredModel = TypeVar("StructuredModel", bound=BaseModel)


class StructuredLLM(Protocol):
    def generate_structured(
        self,
        system: str,
        user: str,
        response_model: type[StructuredModel],
    ) -> tuple[StructuredModel, str]: ...


class LLMResponseError(RuntimeError):
    pass


def _strip_code_fence(content: str) -> str:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.I)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _repair_truncated_json(text: str) -> str:
    """Close truncated Gemma JSON (unterminated strings / missing braces)."""
    start = text.find("{")
    if start < 0:
        return text
    text = text[start:]
    in_string = False
    escape = False
    stack: list[str] = []
    for ch in text:
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]" and stack and stack[-1] == ch:
            stack.pop()
    if in_string:
        text += '"'
    # Drop trailing comma before we close
    text = re.sub(r",\s*$", "", text)
    while stack:
        text += stack.pop()
    return text


def parse_llm_json(content: str) -> object:
    raw = _strip_code_fence(content)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        repaired = _repair_truncated_json(raw)
        return json.loads(repaired)


class OllamaClient:
    def __init__(
        self,
        base_url: str,
        chat_model: str,
        embed_model: str,
        fallback_model: str | None = None,
        timeout_seconds: float = 120,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.chat_model = chat_model
        self.fallback_model = fallback_model
        self.embed_model = embed_model
        self.timeout_seconds = timeout_seconds
        self._check_cache: tuple[float, dict[str, object]] | None = None

    def available_models(self) -> list[str]:
        response = httpx.get(f"{self.base_url}/api/tags", timeout=self.timeout_seconds)
        response.raise_for_status()
        return [model["name"] for model in response.json().get("models", [])]

    def check(self, cache_seconds: float = 10.0) -> dict[str, object]:
        """Readiness probe: is Ollama reachable and are the demo models pulled?"""
        cached = self._check_cache
        if cached and monotonic() - cached[0] < cache_seconds:
            return cached[1]

        try:
            names = self.available_models()
        except Exception as error:  # noqa: BLE001 — report, never crash health
            status: dict[str, object] = {
                "ready": False,
                "reachable": False,
                "detail": f"{type(error).__name__}: {error}"[:200],
                "base_url": self.base_url,
            }
        else:
            def pulled(model: str) -> bool:
                wanted = model.split(":")[0]
                return any(name == model or name.split(":")[0] == wanted for name in names)

            chat_ok = pulled(self.chat_model)
            embed_ok = pulled(self.embed_model)
            status = {
                "ready": chat_ok and embed_ok,
                "reachable": True,
                "chat_model": self.chat_model,
                "chat_model_pulled": chat_ok,
                "embed_model": self.embed_model,
                "embed_model_pulled": embed_ok,
                "base_url": self.base_url,
            }
            if not chat_ok or not embed_ok:
                missing = [
                    model
                    for model, ok in ((self.chat_model, chat_ok), (self.embed_model, embed_ok))
                    if not ok
                ]
                status["detail"] = "Model not pulled: " + ", ".join(missing)

        self._check_cache = (monotonic(), status)
        return status

    def generate_structured(
        self,
        system: str,
        user: str,
        response_model: type[StructuredModel],
    ) -> tuple[StructuredModel, str]:
        models = [self.chat_model]
        if self.fallback_model and self.fallback_model != self.chat_model:
            models.append(self.fallback_model)
        schema = ollama_compatible_schema(response_model.model_json_schema())
        failures: list[str] = []
        for model in models:
            for attempt in range(3):
                repair = (
                    "\nYour previous response was invalid. Return only JSON matching the schema."
                    if attempt
                    else ""
                )
                try:
                    response = httpx.post(
                        f"{self.base_url}/api/chat",
                        json={
                            "model": model,
                            "stream": False,
                            "format": schema,
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": f"{user}{repair}"},
                            ],
                            # num_predict: gemma3 often truncates long AnswerDraft JSON
                            # mid-string without a higher cap → JSONDecodeError.
                            "options": {"temperature": 0.1, "num_predict": 4096},
                        },
                        timeout=self.timeout_seconds,
                    )
                    if response.is_error:
                        detail = response.text[:300].replace("\n", " ")
                        failures.append(
                            f"{model}:HTTPStatusError({response.status_code}:{detail})"
                        )
                        continue
                    content = response.json()["message"]["content"]
                    parsed = parse_llm_json(content)
                    return response_model.model_validate(parsed), model
                except (
                    httpx.HTTPError,
                    OSError,
                    KeyError,
                    TypeError,
                    json.JSONDecodeError,
                    ValidationError,
                ) as error:
                    failures.append(f"{model}:{type(error).__name__}({error})"[:200])
                    if isinstance(error, (OSError, json.JSONDecodeError)):
                        # Socket blip or truncated JSON — brief pause then retry.
                        sleep(0.5)
        raise LLMResponseError(
            "Local LLM failed to return valid structured output: " + ", ".join(failures)
        )

    def embed(self, text: str) -> list[float]:
        return self.embed_many([text])[0]

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = httpx.post(
            f"{self.base_url}/api/embed",
            json={"model": self.embed_model, "input": texts},
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        embeddings = response.json().get("embeddings", [])
        if len(embeddings) != len(texts):
            raise ValueError("Ollama returned an unexpected embedding count")
        return embeddings
