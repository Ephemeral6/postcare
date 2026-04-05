import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "emotion.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()


async def assess_and_comfort(report_summary, user_message=""):
    """评估情绪并安抚患者"""
    try:
        user_input = f"我的报告结果：{report_summary}"
        if user_message:
            user_input += f"\n我的感受：{user_message}"

        result = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_input
        )
        return result
    except Exception as e:
        logger.error(f"情绪评估失败: {e}")
        return {"error": f"情绪评估失败: {str(e)}", "success": False}
