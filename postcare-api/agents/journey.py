import os
import json
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "journey.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def full_journey(report_text: str, user_note: str = "") -> dict:
    """一站式全流程：报告解读 + 用药 + 复查 + 生活方式 + 情绪 + 档案卡"""
    try:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{report_text}", report_text
        ).replace(
            "{user_note}", user_note or "无"
        )

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt="请根据以上报告完成全流程分析。"
        )
        return result
    except Exception as e:
        logger.error(f"全流程分析失败: {e}")
        return {"error": f"全流程分析失败: {str(e)}", "success": False}
