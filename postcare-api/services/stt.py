import tempfile
import os

model = None


def _get_model():
    global model
    if model is None:
        import whisper
        model = whisper.load_model("base")
    return model


async def recognize(audio_bytes: bytes) -> str:
    """语音转文字"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        f.flush()
        tmp_path = f.name
    try:
        result = _get_model().transcribe(tmp_path, language="zh")
        return result["text"]
    finally:
        os.unlink(tmp_path)
