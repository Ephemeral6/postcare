import edge_tts


async def synthesize(text: str) -> bytes:
    """文字转语音，返回mp3字节"""
    communicate = edge_tts.Communicate(text, "zh-CN-XiaoxiaoNeural")
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data
