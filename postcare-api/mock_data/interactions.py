from typing import List
import json
import os

_dir = os.path.dirname(os.path.abspath(__file__))
_knowledge_dir = os.path.join(os.path.dirname(_dir), "knowledge")

with open(os.path.join(_knowledge_dir, "drug_interactions.json"), "r", encoding="utf-8") as f:
    _data = json.load(f)

INTERACTIONS = _data.get("interactions", [])

# 加载中西药联用数据（如果存在）
_tcm_path = os.path.join(_knowledge_dir, "tcm_western.json")
TCM_WESTERN_WARNINGS = []
if os.path.exists(_tcm_path):
    with open(_tcm_path, "r", encoding="utf-8") as f:
        _tcm_data = json.load(f)
    TCM_WESTERN_WARNINGS = _tcm_data.get("interactions", _tcm_data.get("warnings", []))


def find_interactions(drug_names: List[str]) -> str:
    """查找药物列表中存在的相互作用，返回供LLM参考的文本"""
    name_set = set(drug_names)
    found = []

    for inter in INTERACTIONS:
        a = inter.get("drug_a", "")
        b = inter.get("drug_b", "")
        if a in name_set and b in name_set:
            found.append(
                f"- [{inter.get('severity', 'unknown')}] {a} + {b}: "
                f"{inter.get('patient_warning', inter.get('clinical_effect', ''))}"
            )

    # 检查中西药联用
    for warn in TCM_WESTERN_WARNINGS:
        a = warn.get("tcm_drug", warn.get("drug_a", ""))
        b = warn.get("western_drug", warn.get("drug_b", ""))
        if a in name_set and b in name_set:
            found.append(
                f"- [中西药联用] {a} + {b}: "
                f"{warn.get('patient_warning', warn.get('warning', ''))}"
            )

    if not found:
        return "未在知识库中发现已知的药物相互作用，但仍请基于专业知识判断。"
    return "\n".join(found)
