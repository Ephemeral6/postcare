import io

ocr_engine = None


def _get_engine():
    global ocr_engine
    if ocr_engine is None:
        from paddleocr import PaddleOCR
        ocr_engine = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    return ocr_engine


async def extract_text(image_bytes: bytes) -> str:
    """从图片提取文字"""
    import numpy as np
    from PIL import Image

    image = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(image)
    result = _get_engine().ocr(img_array)
    lines = []
    if result and result[0]:
        for line in result[0]:
            lines.append(line[1][0])
    return "\n".join(lines)
