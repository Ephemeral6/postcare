from openai import OpenAI
import json
import logging
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
    timeout=120.0
)


class LLMJsonParseError(Exception):
    """LLM返回的内容无法解析为JSON"""
    pass


class LLMCallError(Exception):
    """LLM调用失败"""
    pass


def _repair_json(text: str) -> dict:
    """迭代修复JSON中未转义的引号（Claude中文文本常见问题）"""
    for _ in range(200):
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            pos = e.pos
            # 常见情况：字符串值内有未转义的引号，如 "身体的"防御部队""
            # JSON解析器遇到中间的"以为字符串结束，然后发现意外字符
            look = pos - 1
            while look >= 0 and text[look] in ' \t\n\r':
                look -= 1
            if look >= 0 and text[look] == '"' and (look == 0 or text[look - 1] != '\\'):
                text = text[:look] + '\\"' + text[look + 1:]
                continue
            raise
    raise json.JSONDecodeError("修复尝试超过200次", text[:200], 0)


def _extract_json(raw_text: str) -> dict:
    """从LLM返回的文本中提取JSON，处理```json代码块和未转义引号"""
    text = raw_text.strip()

    # 提取 ```json 代码块
    if "```json" in text:
        text = text.split("```json", 1)[1]
        if "```" in text:
            text = text.split("```", 1)[0]
        text = text.strip()
    elif "```" in text:
        text = text.split("```", 1)[1]
        if "```" in text:
            text = text.split("```", 1)[0]
        text = text.strip()

    # 直接解析
    if text.startswith("{"):
        return _repair_json(text)

    # fallback: 找第一个 { 到最后一个 }
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        return _repair_json(text[start:end])

    raise json.JSONDecodeError("No JSON object found", text[:200], 0)


async def call_llm(system_prompt: str, user_prompt: str, max_retries: int = 1) -> dict:
    """调LLM，返回解析后的dict。JSON解析失败时自动重试一次。"""
    last_error = None
    raw_text = None

    for attempt in range(max_retries + 1):
        try:
            response = client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=16384
            )
            raw_text = response.choices[0].message.content
            return _extract_json(raw_text)
        except json.JSONDecodeError as e:
            last_error = e
            logger.warning(f"JSON解析失败 (第{attempt + 1}次)，原始内容: {raw_text[:200] if raw_text else 'None'}")
            if attempt < max_retries:
                logger.info("正在重试LLM调用...")
                continue
        except Exception as e:
            raise LLMCallError(f"LLM调用失败: {str(e)}") from e

    raise LLMJsonParseError(
        f"LLM返回内容无法解析为JSON (已重试{max_retries}次)，"
        f"原始内容前200字符: {raw_text[:200] if raw_text else 'None'}"
    )


async def call_llm_text(system_prompt: str, user_prompt: str) -> str:
    """调LLM，返回纯文本（用于对话）"""
    try:
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            max_tokens=16384
        )
        return response.choices[0].message.content
    except Exception as e:
        raise LLMCallError(f"LLM调用失败: {str(e)}") from e


async def call_llm_stream(system_prompt: str, user_prompt: str):
    """流式调用LLM，返回AsyncGenerator"""
    stream = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=16384,
        stream=True
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
