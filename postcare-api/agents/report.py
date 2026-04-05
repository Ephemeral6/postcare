import os
import logging
from llm import call_llm
from mock_data.lab_references import get_reference_text

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "report.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def analyze(text: str) -> dict:
    """解读检查报告文本，返回结构化结果"""
    try:
        # 空输入检查：避免LLM对空内容产生幻觉
        stripped = text.strip() if text else ""
        if not stripped:
            return {
                "summary": "未检测到有效的检查报告内容，请重新输入或上传您的检查报告。",
                "indicators": [],
                "attention_items": ["请提供完整的检查报告文本或图片，以便为您进行专业解读。"],
                "emotion_trigger": "none",
                "emotion_trigger_reason": "未提供报告内容",
                "disclaimer": "以上解读仅供参考，具体诊疗请遵医嘱"
            }

        reference_data = get_reference_text()
        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace("{reference_data}", reference_data)

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt=f"请解读以下检查报告：\n\n{text}"
        )
        return result
    except Exception as e:
        logger.error(f"报告解读失败: {e}")
        return {"error": f"报告解读失败: {str(e)}", "success": False}
