import json
import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "alert.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()


async def check(indicators):
    """检查指标异常预警"""
    try:
        user_input = (
            f"请检查以下指标是否有异常预警：\n"
            f"{json.dumps(indicators, ensure_ascii=False, indent=2)}"
        )

        result = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_input
        )
        return result
    except Exception as e:
        logger.error(f"异常预警检查失败: {e}")
        return {"error": f"异常预警检查失败: {str(e)}", "success": False}
