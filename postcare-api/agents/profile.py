import os
import json
import logging
from datetime import date
from llm import call_llm

logger = logging.getLogger(__name__)

_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "profile.txt")
with open(_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


async def generate(report_summary: dict, medications: list, followup_plan: dict) -> dict:
    """整合报告+用药+复查，生成病情档案卡"""
    try:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.replace(
            "{report_summary}", json.dumps(report_summary, ensure_ascii=False, indent=2)
        ).replace(
            "{medications}", json.dumps(medications, ensure_ascii=False, indent=2)
        ).replace(
            "{followup_plan}", json.dumps(followup_plan, ensure_ascii=False, indent=2)
        ).replace(
            "{generated_date}", date.today().isoformat()
        )

        result = await call_llm(
            system_prompt=system_prompt,
            user_prompt="请根据以上信息生成病情档案卡。"
        )
        return result
    except Exception as e:
        logger.error(f"病情档案卡生成失败: {e}")
        return {"error": f"病情档案卡生成失败: {str(e)}", "success": False}
