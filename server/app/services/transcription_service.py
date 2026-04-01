from __future__ import annotations

import base64
import json
import logging
from urllib import error, request

from app.core.config import get_settings


logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/flac",
    "audio/aac",
}

# Map MIME types to the short format string expected by Gemini input_audio.
_MIME_TO_FORMAT: dict[str, str] = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
    "audio/flac": "flac",
    "audio/aac": "aac",
}


class TranscriptionError(RuntimeError):
    pass


class TranscriptionConfigError(TranscriptionError):
    pass


class TranscriptionProviderError(TranscriptionError):
    pass


def mime_to_format(content_type: str) -> str:
    """Extract the short format string from a MIME content type."""
    base = content_type.split(";")[0].strip().lower()
    fmt = _MIME_TO_FORMAT.get(base)
    if not fmt:
        raise TranscriptionError(f"Unsupported audio format: {base}")
    return fmt


def transcribe_audio(audio_bytes: bytes, audio_format: str, language: str | None = None) -> str:
    """Transcribe audio bytes using Gemini's OpenAI-compatible chat/completions endpoint.

    The audio is sent as base64-encoded input_audio content within a chat message.
    Gemini is instructed to return only the verbatim transcript.
    """
    settings = get_settings()

    if not settings.openai_api_key:
        raise TranscriptionConfigError(
            "Transcription is not configured. Set OPENAI_API_KEY and OPENAI_BASE_URL."
        )

    audio_b64 = base64.standard_b64encode(audio_bytes).decode("ascii")

    prompt = "Transcribe this audio faithfully. Return only the verbatim transcript text, nothing else."
    if language:
        prompt += f" The audio is in {language}."

    payload = {
        "model": settings.transcription_model,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": audio_b64,
                            "format": audio_format,
                        },
                    },
                ],
            },
        ],
    }

    base_url = (settings.openai_base_url or "https://api.openai.com/v1").rstrip("/")
    endpoint = f"{base_url}/chat/completions"

    req = request.Request(
        url=endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=settings.transcription_timeout_seconds) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        logger.warning(
            "Transcription provider HTTP error model=%s endpoint=%s status=%s body=%s",
            settings.transcription_model,
            endpoint,
            exc.code,
            detail[:1000],
        )
        raise TranscriptionProviderError(
            f"Transcription provider returned status {exc.code}. Check configuration and API key."
        ) from exc
    except error.URLError as exc:
        logger.warning(
            "Transcription provider network error model=%s endpoint=%s reason=%s",
            settings.transcription_model,
            endpoint,
            exc.reason,
        )
        raise TranscriptionProviderError(
            "Transcription provider unreachable. Check network and OPENAI_BASE_URL."
        ) from exc
    except TimeoutError as exc:
        logger.warning(
            "Transcription provider timeout model=%s endpoint=%s timeout=%s",
            settings.transcription_model,
            endpoint,
            settings.transcription_timeout_seconds,
        )
        raise TranscriptionProviderError(
            "Transcription request timed out. Try again or increase TRANSCRIPTION_TIMEOUT_SECONDS."
        ) from exc

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning(
            "Transcription response missing content model=%s payload=%s",
            settings.transcription_model,
            json.dumps(data, ensure_ascii=False)[:1000],
        )
        raise TranscriptionProviderError(
            "Transcription provider returned an unexpected response."
        ) from exc

    if not isinstance(content, str) or not content.strip():
        raise TranscriptionProviderError("Transcription returned empty text.")

    return content.strip()
