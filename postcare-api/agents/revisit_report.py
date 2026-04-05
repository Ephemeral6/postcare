import json
import os
import logging
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "revisit_report.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def generate(original_report, new_report, medications, symptoms_update=""):
    """对比两次报告，生成复诊汇报"""
    try:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{original_report}", json.dumps(original_report, ensure_ascii=False, indent=2)
        ).replace(
            "{new_report}", json.dumps(new_report, ensure_ascii=False, indent=2)
        ).replace(
            "{medications}", json.dumps(medications, ensure_ascii=False)
        ).replace(
            "{symptoms_update}", symptoms_update or "患者未提供近期症状变化"
        )

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt="请根据以上两次报告数据生成复诊汇报。"
        )
        return result
    except Exception as e:
        logger.error(f"复诊汇报生成失败: {e}")
        return {"error": f"复诊汇报生成失败: {str(e)}", "success": False}
