from typing import List
import os
import logging
from llm import call_llm
from mock_data.medications import get_drug_info_text
from mock_data.interactions import find_interactions

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "medication.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def analyze(drugs: List[str]) -> dict:
    """分析药品列表，返回用药指导"""
    try:
        # 空列表检查
        if not drugs:
            return {
                "drugs": [],
                "interactions": [],
                "tcm_western_warnings": [],
                "schedule": {"morning": [], "noon": [], "evening": []},
                "disclaimer": "未提供药物列表，请输入您正在服用的药物名称。"
            }

        drug_info = get_drug_info_text(drugs)
        interactions = find_interactions(drugs)

        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{drug_info}", drug_info
        ).replace(
            "{interactions}", interactions
        )

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt=f"请为以下药品提供用药指导：{', '.join(drugs)}"
        )
        return result
    except Exception as e:
        logger.error(f"用药分析失败: {e}")
        return {"error": f"用药分析失败: {str(e)}", "success": False}
