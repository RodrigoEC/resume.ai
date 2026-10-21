import shutil
import tempfile
from collections.abc import AsyncIterable
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.sse import EventSourceResponse, ServerSentEvent

from app.services.xp import xp_service

router = APIRouter(prefix="/xp", tags=["xp"])


@router.post("/stream", response_class=EventSourceResponse)
async def stream(audio: UploadFile = File(...)) -> AsyncIterable[ServerSentEvent]:
    if not (audio.content_type or "").startswith("audio/"):
        raise HTTPException(status_code=415, detail="Expected an audio file")

    suffix = Path(audio.filename or "").suffix or ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(audio.file, tmp)
    tmp_path = Path(tmp.name)

    try:
        yield ServerSentEvent(comment="received audio")
        yield ServerSentEvent(
            data={"filename": audio.filename, "size": audio.size}, event="received"
        )

        exp_service = xp_service()
        async for update in exp_service.create_xp(str(tmp_path)):
            yield ServerSentEvent(data=update)
    finally:
        tmp_path.unlink(missing_ok=True)
