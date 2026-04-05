import json
import os

_dir = os.path.dirname(os.path.abspath(__file__))
_knowledge_dir = os.path.join(os.path.dirname(_dir), "knowledge")

with open(os.path.join(_knowledge_dir, "lab_references.json"), "r", encoding="utf-8") as f:
    _data = json.load(f)

# 构建 abbreviation -> indicator 的快速查找字典
LAB_REFERENCES = {}
for category in _data.get("categories", []):
    for indicator in category.get("indicators", []):
        abbr = indicator.get("abbreviation", "")
        if abbr:
            LAB_REFERENCES[abbr] = indicator
        # 也用中文名做key
        name = indicator.get("name", "")
        if name:
            LAB_REFERENCES[name] = indicator

# 常用别名映射：老百姓常用名 -> 标准名
_ALIASES = {
    "谷丙转氨酶": "ALT", "谷草转氨酶": "AST",
    "GPT": "ALT", "GOT": "AST",
    "白细胞": "WBC", "红细胞": "RBC",
    "血红蛋白": "Hb", "血色素": "Hb",
    "血小板": "PLT", "血糖": "GLU",
    "肌酐": "Cr", "尿素氮": "BUN",
    "总胆固醇": "TC", "甘油三酯": "TG",
    "尿酸": "UA", "胆红素": "TBIL",
}
for alias, abbr in _ALIASES.items():
    if abbr in LAB_REFERENCES and alias not in LAB_REFERENCES:
        LAB_REFERENCES[alias] = LAB_REFERENCES[abbr]


def get_reference_text() -> str:
    """生成供LLM参考的指标参考值文本"""
    lines = []
    for category in _data.get("categories", []):
        lines.append(f"\n## {category['category_name']}")
        for ind in category.get("indicators", []):
            ref = ind.get("reference_range", {})
            adult = ref.get("adult_male", ref.get("adult_female", {}))
            low = adult.get("min", "")
            high = adult.get("max", "")
            lines.append(
                f"- {ind['name']}({ind.get('abbreviation', '')}) "
                f"参考范围: {low}-{high} {ind.get('unit', '')} "
                f"| 比喻: {ind.get('patient_explanation', {}).get('what_is_it', '')}"
            )
    return "\n".join(lines)
