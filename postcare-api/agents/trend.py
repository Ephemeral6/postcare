import json
import os
import logging
from llm import call_llm
from mock_data.lab_references import LAB_REFERENCES

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "trend.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()


async def analyze(indicator_name, history_values, medications=None):
    """分析指标历史趋势"""
    try:
        # 尝试从知识库获取参考范围
        ref_info = ""
        for key in LAB_REFERENCES:
            if key in indicator_name:
                ind = LAB_REFERENCES[key]
                ref = ind.get("reference_range", {})
                adult = ref.get("adult_male", ref.get("adult_female", {}))
                ref_info = f"\n参考范围：{adult.get('min', '')}-{adult.get('max', '')} {ind.get('unit', '')}"
                break

        user_input = (
            f"指标名称：{indicator_name}{ref_info}\n"
            f"历史数据：{json.dumps(history_values, ensure_ascii=False)}"
        )

        if medications:
            med_text = ", ".join(medications) if isinstance(medications, list) else str(medications)
            user_input += f"\n当前用药/治疗方案：{med_text}"

        result = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_input
        )
        return result
    except Exception as e:
        logger.error(f"趋势分析失败: {e}")
        return {"error": f"趋势分析失败: {str(e)}", "success": False}
