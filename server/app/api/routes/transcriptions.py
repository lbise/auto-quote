from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.user import User
from app.schemas.transcription import TranscriptionResponse
from app.services.transcription_service import (
    ALLOWED_MIME_TYPES,
    TranscriptionConfigError,
    TranscriptionError,
    TranscriptionProviderError,
    mime_to_format,
    transcribe_audio,
)


router = APIRouter(prefix="/transcriptions", tags=["transcriptions"])


@router.post("", response_model=TranscriptionResponse)
async def create_transcription(
    file: UploadFile,
    language: str = Form(default=""),
    current_user: User = Depends(get_current_user),
) -> TranscriptionResponse:
    del current_user
    settings = get_settings()

    # Validate content type
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported audio format: {content_type or 'unknown'}. Supported: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    # Read and validate size
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Audio file is empty.",
        )

    if len(audio_bytes) > settings.transcription_max_file_bytes:
        max_mb = settings.transcription_max_file_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Audio file too large. Maximum size is {max_mb:.0f} MB.",
        )

    try:
        audio_format = mime_to_format(file.content_type or content_type)
    except TranscriptionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    lang_hint = language.strip() or None

    try:
        text = transcribe_audio(audio_bytes, audio_format, language=lang_hint)
    except TranscriptionConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except TranscriptionProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except TranscriptionError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return TranscriptionResponse(text=text)
