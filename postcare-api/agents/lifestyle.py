import json
import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "lifestyle.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def generate(diagnosis, abnormal_indicators, medications):
    """生成个性化生活方式建议"""
    try:
        indicators_text = ", ".join(
            ind if isinstance(ind, str) else json.dumps(ind, ensure_ascii=False)
            for ind in abnormal_indicators
        ) if abnormal_indicators else "无"

        medications_text = ", ".join(medications) if medications else "无"

        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{diagnosis}", diagnosis or "未提供明确诊断"
        ).replace(
            "{abnormal_indicators}", indicators_text
        ).replace(
            "{medications}", medications_text
        )

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt="请根据以上信息生成个性化的生活方式建议。"
        )
        return result
    except Exception as e:
        logger.error(f"生活方式建议生成失败: {e}")
        return {"error": f"生活方式建议生成失败: {str(e)}", "success": False}
