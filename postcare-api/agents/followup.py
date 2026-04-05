import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "followup.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def generate(diagnosis: str, abnormal_indicators: list, current_date: str) -> dict:
    """基于诊断和异常指标生成复查建议"""
    try:
        indicators_text = "\n".join(
            f"- {ind}" if isinstance(ind, str) else f"- {ind.get('name', '')}: {ind.get('value', '')} ({ind.get('status', '')})"
            for ind in abnormal_indicators
        ) if abnormal_indicators else "无明显异常指标"

        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{diagnosis}", diagnosis or "未提供明确诊断"
        ).replace(
            "{abnormal_indicators}", indicators_text
        ).replace(
            "{current_date}", current_date or "未提供"
        )

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt=f"请根据以上信息生成复查建议。"
        )
        return result
    except Exception as e:
        logger.error(f"复查建议生成失败: {e}")
        return {"error": f"复查建议生成失败: {str(e)}", "success": False}
