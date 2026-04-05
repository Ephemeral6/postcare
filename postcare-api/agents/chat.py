import os
import json
import logging
from llm import call_llm_text, call_llm_stream

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "chat.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def ask(message: str, context: dict, history: list) -> dict:
    """基于上下文的追问对话"""
    try:
        context_text = json.dumps(context, ensure_ascii=False, indent=2) if context else "暂无上下文信息"

        history_text = ""
        if history:
            for msg in history:
                role = "患者" if msg.get("role") == "user" else "助手"
                history_text += f"{role}: {msg.get('content', '')}\n"
        else:
            history_text = "无历史对话"

        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{context}", context_text
        ).replace(
            "{history}", history_text
        )

        answer = await call_llm_text(
            system_prompt=system_prompt,
            user_prompt=message
        )
        return {"reply": answer}
    except Exception as e:
        logger.error(f"对话失败: {e}")
        return {"reply": "抱歉，AI服务暂时不可用，请稍后重试。", "error": str(e), "success": False}


async def ask_stream(message, context, history):
    """流式回答追问"""
    try:
        context_text = json.dumps(context, ensure_ascii=False) if context else "暂无上下文信息"

        history_text = ""
        if history:
            for msg in history:
                role = "患者" if msg.get("role") == "user" else "助手"
                history_text += f"{role}: {msg.get('content', '')}\n"
        else:
            history_text = "无历史对话"

        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{context}", context_text
        ).replace(
            "{history}", history_text
        )

        async for token in call_llm_stream(system_prompt, message):
            yield token
    except Exception as e:
        logger.error(f"流式对话失败: {e}")
        yield f"\n\n[错误] AI服务暂时不可用: {str(e)}"
