import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "pre_visit_checklist.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()


async def generate(department, symptoms=""):
    """生成就诊准备清单"""
    try:
        user_input = f"我要去{department}看病。"
        if symptoms:
            user_input += f"\n我的症状：{symptoms}"

        result = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_input
        )
        return result
    except Exception as e:
        logger.error(f"就诊准备清单生成失败: {e}")
        return {"error": f"就诊准备清单生成失败: {str(e)}", "success": False}
