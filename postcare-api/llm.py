from openai import OpenAI
import json
import logging
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL
)


class LLMJsonParseError(Exception):
    """LLM返回的内容无法解析为JSON"""
    pass


class LLMCallError(Exception):
    """LLM调用失败"""
    pass


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
                response_format={"type": "json_object"}
            )
            raw_text = response.choices[0].message.content
            return json.loads(raw_text)
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
            temperature=0.5
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
        stream=True
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
