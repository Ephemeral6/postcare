import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "pre_visit.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()


async def interview(symptoms, history=""):
    """预问诊：整理患者症状为结构化报告"""
    try:
        user_input = f"我的症状：{symptoms}"
        if history:
            user_input += f"\n既往病史：{history}"

        result = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_input
        )
        return result
    except Exception as e:
        logger.error(f"预问诊失败: {e}")
        return {"error": f"预问诊失败: {str(e)}", "success": False}
