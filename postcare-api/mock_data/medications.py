from typing import List
import json
import os

_dir = os.path.dirname(os.path.abspath(__file__))
_knowledge_dir = os.path.join(os.path.dirname(_dir), "knowledge")

with open(os.path.join(_knowledge_dir, "medications.json"), "r", encoding="utf-8") as f:
    _data = json.load(f)

# 构建 药名 -> 药物信息 的快速查找字典
MEDICATIONS = {}
for drug in _data.get("drugs", []):
    name = drug.get("name_generic", "")
    if name:
        MEDICATIONS[name] = drug
    # 也用品牌名做key
    for brand in drug.get("brand_names", []):
        MEDICATIONS[brand] = drug


def _fuzzy_find(name: str):
    """模糊匹配药名：找编辑距离<=1或包含关系的药物"""
    # 1. 精确匹配
    if name in MEDICATIONS:
        return MEDICATIONS[name], None
    # 2. 包含匹配（输入是某药名的子串或反过来）
    for key, drug in MEDICATIONS.items():
        if len(name) >= 2 and (name in key or key in name):
            return drug, key
    # 3. 单字差异匹配（编辑距离1）
    for key, drug in MEDICATIONS.items():
        if abs(len(name) - len(key)) <= 1 and len(name) >= 2:
            diff = sum(1 for a, b in zip(name, key) if a != b)
            diff += abs(len(name) - len(key))
            if diff <= 1:
                return drug, key
    return None, None


def get_drug_info_text(drug_names: List[str]) -> str:
    """根据药名列表，生成供LLM参考的药物信息文本"""
    lines = []
    for name in drug_names:
        drug, corrected_name = _fuzzy_find(name)
        if drug:
            generic = drug['name_generic']
            if corrected_name:
                lines.append('\n### ' + generic + '(用户输入"' + name + '", 已自动匹配为"' + generic + '", 请在回复中提示用户正确药名)')
            else:
                lines.append('\n### ' + generic)
            lines.append(f"- 作用: {drug.get('function_simple', drug.get('function', ''))}")
            dosage = drug.get("dosage", {})
            lines.append(f"- 用量: {dosage.get('common', '')}")
            timing = drug.get("timing", {})
            lines.append(f"- 服药时间: {timing.get('when', '')} {timing.get('relation_to_meal', '')}")
            lines.append(f"- 禁忌: {', '.join(drug.get('contraindications', []))}")
            lines.append(f"- 饮食注意: {', '.join(drug.get('food_warnings', []))}")
            lines.append(f"- 是否中药: {'是' if drug.get('is_tcm') else '否'}")
        else:
            lines.append('\n### ' + name + '\n- WARNING: 知识库中未找到该药物。请在返回结果中明确告知用户该药物不在知识库中, 无法提供准确的用药指导, 请咨询医生或药师。不要编造药物信息。')
    return "\n".join(lines)
