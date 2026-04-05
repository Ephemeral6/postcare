"""
PostCare 医学内容大规模审核脚本 — 100个测试用例
覆盖：报告解读(40) / 用药分析(25) / 情绪关怀(15) / 复查建议(10) / 生活方式(5) / 趋势分析(3) / 异常预警(2)
"""
import json
import urllib.request
import sys
import io
import time
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE = "http://localhost:8000"
results = []

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def call_api(path, data):
    url = f"{BASE}{path}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"_api_error": str(e)}


def contains(result, keywords):
    """result JSON 中是否包含任一关键词（不区分大小写）"""
    text = json.dumps(result, ensure_ascii=False).lower()
    return any(kw.lower() in text for kw in keywords)


def contains_all(result, keywords):
    """result JSON 中是否包含所有关键词"""
    text = json.dumps(result, ensure_ascii=False).lower()
    return all(kw.lower() in text for kw in keywords)


def field_eq(result, path, expected):
    """按 dot-path 取值并比较（支持列表中每个元素的 status 等）"""
    obj = result
    for key in path.split("."):
        if isinstance(obj, dict):
            obj = obj.get(key)
        elif isinstance(obj, list) and key.isdigit():
            obj = obj[int(key)]
        else:
            return False
    if isinstance(expected, (list, tuple)):
        return obj in expected
    return obj == expected


def all_status_normal(result):
    """indicators 列表里所有项 status==normal"""
    indicators = result.get("indicators", [])
    if not indicators:
        return False
    return all(ind.get("status") == "normal" for ind in indicators)


def any_indicator_status(result, status):
    for ind in result.get("indicators", []):
        if ind.get("status") == status:
            return True
    return False


def check(test_id, test_name, api_path, data, checks):
    tag = f"[{test_id:>3}]"
    sys.stderr.write(f"  {tag} {test_name} ... ")
    sys.stderr.flush()

    resp = call_api(api_path, data)

    if "_api_error" in resp:
        results.append({
            "id": test_id, "name": test_name,
            "score": 0, "total": len(checks),
            "issues": [f"API调用失败: {resp['_api_error']}"],
        })
        sys.stderr.write("ERROR\n")
        return

    # agent-level graceful error
    if resp.get("success") is False or ("error" in resp and "success" in resp):
        results.append({
            "id": test_id, "name": test_name,
            "score": 0, "total": len(checks),
            "issues": [f"Agent返回错误: {resp.get('error','')}"],
        })
        sys.stderr.write("AGENT-ERR\n")
        return

    passed = 0
    issues = []
    for desc, fn in checks:
        try:
            ok, detail = fn(resp)
            if ok:
                passed += 1
            else:
                issues.append(f"  {desc}: {detail}")
        except Exception as e:
            issues.append(f"  {desc}: 检查异常 - {e}")

    results.append({
        "id": test_id, "name": test_name,
        "score": passed, "total": len(checks),
        "issues": issues,
    })
    status = "PASS" if passed == len(checks) else f"FAIL({passed}/{len(checks)})"
    sys.stderr.write(f"{status}\n")


# ===================================================================
# PART 1 — 报告解读  (tests 1-40)   /api/report/analyze
# ===================================================================
REPORT = "/api/report/analyze"

def run_report_tests():
    # ---------- 血常规 1-10 ----------
    check(1, "WBC极高(25.0)—严重感染/白血病", REPORT,
        {"text": "白细胞计数(WBC) 25.0 3.5-9.5 ×10⁹/L"},
        [
            ("是否标记high", lambda r: (any_indicator_status(r, "high"), "WBC未标记high")),
            ("是否提到感染", lambda r: (contains(r, ["感染", "炎症"]), "未提到感染")),
            ("是否提到白血病/血液病可能", lambda r: (contains(r, ["白血病", "血液", "骨髓", "恶性"]), "WBC 25极高未提到血液病可能性")),
            ("emotion_trigger不为none", lambda r: (not field_eq(r, "emotion_trigger", "none"), "严重异常emotion_trigger不应为none")),
        ])

    check(2, "WBC极低(1.8)—粒缺风险", REPORT,
        {"text": "白细胞计数(WBC) 1.8 3.5-9.5 ×10⁹/L"},
        [
            ("是否标记low", lambda r: (any_indicator_status(r, "low"), "WBC未标记low")),
            ("是否提到免疫力低下", lambda r: (contains(r, ["免疫", "抵抗力", "感染风险"]), "未提到免疫力低下")),
            ("是否提到粒缺/白细胞减少", lambda r: (contains(r, ["粒细胞减少", "白细胞减少", "粒缺", "缺乏"]), "未提到粒缺相关")),
        ])

    check(3, "HGB极低(55)—重度贫血", REPORT,
        {"text": "血红蛋白(HGB) 55 130-175 g/L"},
        [
            ("是否标记low", lambda r: (any_indicator_status(r, "low"), "HGB未标记low")),
            ("是否提到重度/严重贫血", lambda r: (contains(r, ["重度", "严重", "重", "dangerous", "危"]), "HGB55未提到严重程度")),
            ("是否建议立即就医", lambda r: (contains(r, ["立即", "尽快", "急", "马上", "紧急"]), "未建议紧急就医")),
        ])

    check(4, "HGB轻度偏低(118女性)", REPORT,
        {"text": "血红蛋白(HGB) 118 110-150 g/L（女性参考）"},
        [
            ("是否标记normal或说明轻度", lambda r: (contains(r, ["正常", "轻度", "轻微", "稍", "borderline"]), "未安抚轻度偏低")),
        ])

    check(5, "PLT极低(30)—出血风险", REPORT,
        {"text": "血小板计数(PLT) 30 125-350 ×10⁹/L"},
        [
            ("是否标记low", lambda r: (any_indicator_status(r, "low"), "PLT未标记low")),
            ("是否提到出血风险", lambda r: (contains(r, ["出血", "bleeding", "瘀", "紫癜"]), "未提到出血风险")),
            ("是否建议就医", lambda r: (contains(r, ["就医", "医院", "就诊", "医生"]), "未建议就医")),
        ])

    check(6, "PLT极高(800)—骨髓增殖", REPORT,
        {"text": "血小板计数(PLT) 800 125-350 ×10⁹/L"},
        [
            ("是否标记high", lambda r: (any_indicator_status(r, "high"), "PLT未标记high")),
            ("是否提到血栓或骨髓问题", lambda r: (contains(r, ["血栓", "凝血", "骨髓", "增殖", "增多"]), "未提到血栓/骨髓相关")),
        ])

    check(7, "WBC+NEUT%同时高—细菌感染", REPORT,
        {"text": "白细胞计数(WBC) 16.2 3.5-9.5 ×10⁹/L\n中性粒细胞比率(NEUT%) 82.0 40-75 %"},
        [
            ("是否联合分析提示细菌感染", lambda r: (contains(r, ["细菌感染", "细菌"]), "未提到细菌感染")),
        ])

    check(8, "WBC高+LYMPH%高+NEUT%低—病毒感染", REPORT,
        {"text": "白细胞计数(WBC) 12.0 3.5-9.5 ×10⁹/L\n淋巴细胞比率(LYMPH%) 55.0 20-50 %\n中性粒细胞比率(NEUT%) 35.0 40-75 %"},
        [
            ("是否提到病毒感染可能", lambda r: (contains(r, ["病毒", "病毒感染", "淋巴"]), "LYMPH%高未提到病毒感染")),
        ])

    check(9, "三系减少—骨髓问题", REPORT,
        {"text": "白细胞计数(WBC) 2.5 3.5-9.5 ×10⁹/L\n血红蛋白(HGB) 80 130-175 g/L\n血小板计数(PLT) 60 125-350 ×10⁹/L"},
        [
            ("是否提到骨髓/全血细胞减少", lambda r: (contains(r, ["骨髓", "全血细胞", "三系", "再生障碍", "血液科"]), "三系减少未提到骨髓问题")),
            ("emotion_trigger不为none", lambda r: (not field_eq(r, "emotion_trigger", "none"), "三系减少emotion应非none")),
        ])

    check(10, "血常规全部正常", REPORT,
        {"text": "白细胞计数(WBC) 6.5 3.5-9.5 ×10⁹/L\n血红蛋白(HGB) 145 130-175 g/L\n血小板计数(PLT) 220 125-350 ×10⁹/L"},
        [
            ("全部标记normal", lambda r: (all_status_normal(r), "有指标未标记normal")),
            ("emotion_trigger为none", lambda r: (field_eq(r, "emotion_trigger", "none"), "正常报告emotion_trigger应为none")),
            ("summary不制造焦虑", lambda r: (contains(r, ["正常", "良好", "健康", "没有异常"]), "summary未体现正常")),
        ])

    # ---------- 肝功能 11-18 ----------
    check(11, "ALT轻度升高(65)—安抚+复查", REPORT,
        {"text": "谷丙转氨酶(ALT) 65 0-40 U/L"},
        [
            ("是否标记high", lambda r: (any_indicator_status(r, "high"), "ALT未标记high")),
            ("是否安抚或说明轻度", lambda r: (contains(r, ["轻度", "轻微", "稍", "不用太担心", "复查"]), "ALT65未安抚")),
        ])

    check(12, "ALT显著升高(500)—急性肝损伤", REPORT,
        {"text": "谷丙转氨酶(ALT) 500 0-40 U/L"},
        [
            ("是否提到急性/严重肝损伤", lambda r: (contains(r, ["急性", "严重", "明显", "显著"]), "ALT500未提到严重")),
            ("是否建议尽快就医", lambda r: (contains(r, ["尽快", "立即", "就医", "就诊", "医院"]), "未建议就医")),
        ])

    check(13, "ALT+AST+TBIL全高—肝炎/胆道", REPORT,
        {"text": "谷丙转氨酶(ALT) 320 0-40 U/L\n谷草转氨酶(AST) 280 0-40 U/L\n总胆红素(TBIL) 52 0-21 μmol/L"},
        [
            ("是否联合分析提示肝炎/胆道", lambda r: (contains(r, ["肝炎", "肝", "胆", "黄疸"]), "未提到肝炎/胆道")),
            ("是否提到黄疸", lambda r: (contains(r, ["黄疸", "发黄", "皮肤"]), "TBIL52未提到黄疸")),
        ])

    check(14, "只有GGT偏高—饮酒/胆管", REPORT,
        {"text": "谷氨酰转肽酶(GGT) 120 0-50 U/L\n谷丙转氨酶(ALT) 30 0-40 U/L"},
        [
            ("是否提到饮酒或胆管", lambda r: (contains(r, ["饮酒", "酒", "胆管", "胆", "脂肪肝"]), "GGT偏高未提到饮酒/胆管")),
        ])

    check(15, "ALB极低(25)—营养不良/肝硬化", REPORT,
        {"text": "白蛋白(ALB) 25 40-55 g/L"},
        [
            ("是否提到营养或肝硬化", lambda r: (contains(r, ["营养", "肝硬化", "低蛋白", "水肿", "合成"]), "ALB25未提到营养不良/肝硬化")),
        ])

    check(16, "TBIL升高ALT正常—溶血/Gilbert", REPORT,
        {"text": "总胆红素(TBIL) 38 0-21 μmol/L\n间接胆红素(IBIL) 30 0-15 μmol/L\n谷丙转氨酶(ALT) 20 0-40 U/L"},
        [
            ("是否提到溶血或Gilbert", lambda r: (contains(r, ["溶血", "Gilbert", "吉尔伯特", "间接胆红素", "红细胞破坏", "生理性"]), "未提到溶血/Gilbert可能")),
        ])

    check(17, "AST/ALT>2—酒精性肝损伤", REPORT,
        {"text": "谷丙转氨酶(ALT) 85 0-40 U/L\n谷草转氨酶(AST) 210 0-40 U/L"},
        [
            ("是否提到酒精/AST>ALT的意义", lambda r: (contains(r, ["酒精", "饮酒", "AST.*高于.*ALT", "AST.*ALT"]), "AST/ALT>2未提到酒精性")),
        ])

    check(18, "肝功全部正常", REPORT,
        {"text": "谷丙转氨酶(ALT) 22 0-40 U/L\n谷草转氨酶(AST) 18 0-40 U/L\n总胆红素(TBIL) 12 0-21 μmol/L\n白蛋白(ALB) 45 40-55 g/L"},
        [
            ("全部normal", lambda r: (all_status_normal(r), "有指标未标记normal")),
            ("emotion_trigger为none", lambda r: (field_eq(r, "emotion_trigger", "none"), "正常肝功emotion应为none")),
        ])

    # ---------- 肾功能 19-24 ----------
    check(19, "CREA轻度升高(150)—肾功能轻度下降", REPORT,
        {"text": "肌酐(CREA) 150 44-133 μmol/L"},
        [
            ("是否提到肾功能下降", lambda r: (contains(r, ["肾功能", "肾", "肾脏"]), "未提到肾功能")),
            ("是否说明轻度", lambda r: (contains(r, ["轻度", "轻微", "偏高", "稍高"]), "CREA150未说明程度")),
        ])

    check(20, "CREA严重升高(500)—肾功能严重受损", REPORT,
        {"text": "肌酐(CREA) 500 44-133 μmol/L"},
        [
            ("是否提到严重肾功能损害", lambda r: (contains(r, ["严重", "明显", "肾功能", "肾衰"]), "CREA500未提到严重")),
            ("是否建议立即就医", lambda r: (contains(r, ["立即", "尽快", "紧急", "就医", "就诊"]), "未建议紧急就医")),
        ])

    check(21, "BUN升高CREA正常—脱水/高蛋白", REPORT,
        {"text": "尿素氮(BUN) 10.5 2.6-7.5 mmol/L\n肌酐(CREA) 90 44-133 μmol/L"},
        [
            ("是否提到非肾脏原因", lambda r: (contains(r, ["脱水", "饮食", "蛋白", "饮水", "进食"]), "BUN升CREA正常未提到非肾脏因素")),
        ])

    check(22, "UA极高(600)—痛风风险", REPORT,
        {"text": "尿酸(UA) 600 208-428 μmol/L"},
        [
            ("是否提到痛风", lambda r: (contains(r, ["痛风"]), "UA600未提到痛风")),
            ("是否有饮食建议", lambda r: (contains(r, ["饮食", "嘌呤", "海鲜", "啤酒", "食物"]), "未给出饮食建议")),
        ])

    check(23, "CREA+BUN+UA全高—联合分析", REPORT,
        {"text": "肌酐(CREA) 200 44-133 μmol/L\n尿素氮(BUN) 15.0 2.6-7.5 mmol/L\n尿酸(UA) 550 208-428 μmol/L"},
        [
            ("是否联合提到肾功能", lambda r: (contains(r, ["肾功能", "肾脏"]), "三项全高未提到肾功能")),
            ("是否建议肾内科", lambda r: (contains(r, ["肾内科", "肾科", "就医", "就诊"]), "未建议就诊")),
        ])

    check(24, "肾功全部正常", REPORT,
        {"text": "肌酐(CREA) 75 44-133 μmol/L\n尿素氮(BUN) 5.0 2.6-7.5 mmol/L\n尿酸(UA) 320 208-428 μmol/L"},
        [
            ("全部normal", lambda r: (all_status_normal(r), "有指标未标记normal")),
        ])

    # ---------- 血脂 25-28 ----------
    check(25, "TC+TG+LDL高+HDL低—心血管风险", REPORT,
        {"text": "总胆固醇(TC) 7.2 0-5.2 mmol/L\n甘油三酯(TG) 3.5 0-1.7 mmol/L\n低密度脂蛋白(LDL) 4.8 0-3.4 mmol/L\n高密度脂蛋白(HDL) 0.8 1.0-1.5 mmol/L"},
        [
            ("是否提到心血管风险", lambda r: (contains(r, ["心血管", "冠心", "动脉硬化", "心脑血管", "心梗", "脑梗"]), "血脂异常未提到心血管风险")),
        ])

    check(26, "TG极高(10.0)—胰腺炎风险", REPORT,
        {"text": "甘油三酯(TG) 10.0 0-1.7 mmol/L"},
        [
            ("是否提到胰腺炎风险", lambda r: (contains(r, ["胰腺炎", "胰腺"]), "TG10未提到胰腺炎风险")),
        ])

    check(27, "LDL极高(5.5)—动脉粥样硬化", REPORT,
        {"text": "低密度脂蛋白(LDL-C) 5.5 0-3.4 mmol/L"},
        [
            ("是否提到动脉粥样硬化", lambda r: (contains(r, ["动脉", "粥样硬化", "血管壁", "斑块"]), "LDL5.5未提到动脉硬化")),
        ])

    check(28, "血脂全部正常", REPORT,
        {"text": "总胆固醇(TC) 4.5 0-5.2 mmol/L\n甘油三酯(TG) 1.2 0-1.7 mmol/L\n低密度脂蛋白(LDL) 2.8 0-3.4 mmol/L"},
        [
            ("全部normal", lambda r: (all_status_normal(r), "有指标未标记normal")),
        ])

    # ---------- 血糖 29-33 ----------
    check(29, "GLU 7.2—糖尿病前期", REPORT,
        {"text": "空腹血糖(GLU) 7.2 3.9-6.1 mmol/L"},
        [
            ("是否提到糖尿病", lambda r: (contains(r, ["糖尿病"]), "GLU7.2未提到糖尿病")),
        ])

    check(30, "GLU 15.0—明确糖尿病", REPORT,
        {"text": "空腹血糖(GLU) 15.0 3.9-6.1 mmol/L"},
        [
            ("是否提到糖尿病", lambda r: (contains(r, ["糖尿病"]), "GLU15未提到糖尿病")),
            ("是否建议就医", lambda r: (contains(r, ["就医", "就诊", "医院", "医生", "内分泌"]), "未建议就医")),
        ])

    check(31, "GLU 2.5—低血糖危险", REPORT,
        {"text": "空腹血糖(GLU) 2.5 3.9-6.1 mmol/L"},
        [
            ("是否提到低血糖", lambda r: (contains(r, ["低血糖"]), "GLU2.5未提到低血糖")),
            ("是否提到危险/立即处理", lambda r: (contains(r, ["危险", "进食", "糖果", "立即", "紧急", "葡萄糖", "严重"]), "低血糖未提到紧急处理")),
        ])

    check(32, "HbA1c 6.8—糖尿病诊断标准", REPORT,
        {"text": "糖化血红蛋白(HbA1c) 6.8 4-6 %"},
        [
            ("是否提到糖尿病", lambda r: (contains(r, ["糖尿病"]), "HbA1c6.8未提到糖尿病")),
            ("是否解释HbA1c含义", lambda r: (contains(r, ["2-3个月", "3个月", "平均血糖", "长期"]), "未解释HbA1c含义")),
        ])

    check(33, "HbA1c 10.0—控制很差", REPORT,
        {"text": "糖化血红蛋白(HbA1c) 10.0 4-6 %"},
        [
            ("是否提到控制不佳", lambda r: (contains(r, ["控制不佳", "控制不好", "控制得不好", "很差", "不理想", "不达标", "严重"]), "HbA1c10未提到控制差")),
            ("是否建议调整方案", lambda r: (contains(r, ["调整", "方案", "就医", "医生"]), "未建议调整治疗")),
        ])

    # ---------- 甲功 34-36 ----------
    check(34, "TSH高+FT4低—甲减", REPORT,
        {"text": "促甲状腺激素(TSH) 15.0 0.27-4.2 mIU/L\n游离甲状腺素(FT4) 5.0 12-22 pmol/L"},
        [
            ("是否提到甲减", lambda r: (contains(r, ["甲减", "甲状腺功能减退", "甲低"]), "TSH高FT4低未提到甲减")),
        ])

    check(35, "TSH低+FT4高—甲亢", REPORT,
        {"text": "促甲状腺激素(TSH) 0.01 0.27-4.2 mIU/L\n游离甲状腺素(FT4) 45.0 12-22 pmol/L"},
        [
            ("是否提到甲亢", lambda r: (contains(r, ["甲亢", "甲状腺功能亢进"]), "TSH低FT4高未提到甲亢")),
        ])

    check(36, "TSH轻度升高+FT4正常—亚临床甲减", REPORT,
        {"text": "促甲状腺激素(TSH) 6.5 0.27-4.2 mIU/L\n游离甲状腺素(FT4) 15.0 12-22 pmol/L"},
        [
            ("是否提到亚临床甲减", lambda r: (contains(r, ["亚临床", "亚甲减", "轻度", "甲减", "观察", "复查"]), "TSH轻度高FT4正常未提到亚临床甲减")),
        ])

    # ---------- 肿瘤标志物 37-40 ----------
    check(37, "AFP升高(200)—肝癌筛查但安抚", REPORT,
        {"text": "甲胎蛋白(AFP) 200 0-7 ng/mL"},
        [
            ("是否提到肝脏相关", lambda r: (contains(r, ["肝", "肝癌", "肝脏"]), "AFP高未提到肝脏")),
            ("是否安抚/提到其他可能", lambda r: (contains(r, ["肝炎", "不一定", "并不意味", "不等于", "炎症", "其他", "良性"]), "AFP高未安抚")),
        ])

    check(38, "CEA轻度升高(8)—安抚+复查", REPORT,
        {"text": "癌胚抗原(CEA) 8.0 0-5 ng/mL"},
        [
            ("是否安抚", lambda r: (contains(r, ["不一定", "不等于", "不意味", "轻度", "复查", "观察", "炎症", "吸烟"]), "CEA8未安抚")),
            ("是否建议复查", lambda r: (contains(r, ["复查", "复检", "随访"]), "未建议复查")),
        ])

    check(39, "PSA升高(12)—前列腺", REPORT,
        {"text": "前列腺特异性抗原(PSA) 12.0 0-4 ng/mL"},
        [
            ("是否提到前列腺", lambda r: (contains(r, ["前列腺"]), "PSA高未提到前列腺")),
        ])

    check(40, "多肿标同时升高—emotion应严重", REPORT,
        {"text": "癌胚抗原(CEA) 25 0-5 ng/mL\n甲胎蛋白(AFP) 150 0-7 ng/mL\n糖类抗原199(CA199) 80 0-37 U/mL"},
        [
            ("是否emotion_trigger非none", lambda r: (not field_eq(r, "emotion_trigger", "none"), "多肿标高emotion应非none")),
            ("是否建议进一步检查", lambda r: (contains(r, ["进一步", "检查", "就医", "就诊", "CT", "B超"]), "多肿标高未建议进一步检查")),
        ])


# ===================================================================
# PART 2 — 用药分析  (tests 41-65)   /api/medication/analyze
# ===================================================================
MED = "/api/medication/analyze"

def run_medication_tests():
    # ---------- 单药 41-50 ----------
    check(41, "阿司匹林单药", MED, {"drugs": ["阿司匹林"]},
        [
            ("是否提到肠溶片/剂型说明", lambda r: (contains(r, ["肠溶", "饭", "空腹", "整片吞服"]), "阿司匹林未提到服用方式")),
        ])

    check(42, "华法林单药", MED, {"drugs": ["华法林"]},
        [
            ("是否提到出血风险", lambda r: (contains(r, ["出血"]), "华法林未提到出血风险")),
            ("是否提到维生素K食物", lambda r: (contains(r, ["维生素K", "菠菜", "西兰花", "绿叶"]), "华法林未提到维K食物")),
        ])

    check(43, "二甲双胍单药", MED, {"drugs": ["二甲双胍"]},
        [
            ("是否提到饭中/饭后", lambda r: (contains(r, ["饭后", "餐后", "饭中", "随餐"]), "二甲双胍未提到餐后服用")),
            ("是否提到胃肠反应", lambda r: (contains(r, ["胃肠", "胃", "肠", "恶心", "腹泻", "消化"]), "未提到胃肠道反应")),
        ])

    check(44, "阿托伐他汀单药", MED, {"drugs": ["阿托伐他汀"]},
        [
            ("是否提到晚上服用", lambda r: (contains(r, ["晚", "夜", "sleep"]), "未提到晚上服用")),
            ("是否提到避免西柚", lambda r: (contains(r, ["西柚", "柚", "grapefruit"]), "未提到避免西柚")),
        ])

    check(45, "奥美拉唑单药", MED, {"drugs": ["奥美拉唑"]},
        [
            ("是否提到饭前服用", lambda r: (contains(r, ["饭前", "餐前", "空腹"]), "奥美拉唑未提到饭前")),
        ])

    check(46, "硝苯地平单药", MED, {"drugs": ["硝苯地平"]},
        [
            ("是否提到不能掰开/嚼碎", lambda r: (contains(r, ["掰", "嚼", "控释", "缓释", "整片"]), "硝苯地平未提到不能嚼碎")),
        ])

    check(47, "氯吡格雷单药", MED, {"drugs": ["氯吡格雷"]},
        [
            ("是否提到出血风险", lambda r: (contains(r, ["出血"]), "氯吡格雷未提到出血风险")),
        ])

    check(48, "左氧氟沙星单药", MED, {"drugs": ["左氧氟沙星"]},
        [
            ("是否提到光敏/日晒", lambda r: (contains(r, ["日晒", "阳光", "光敏", "紫外线", "避光"]), "左氧氟沙星未提到光敏")),
        ])

    check(49, "泼尼松单药", MED, {"drugs": ["泼尼松"]},
        [
            ("是否提到不能骤停", lambda r: (contains(r, ["停药", "骤停", "逐渐", "递减", "减量"]), "泼尼松未提到不能骤停")),
        ])

    check(50, "地高辛单药", MED, {"drugs": ["地高辛"]},
        [
            ("是否提到治疗窗窄/中毒", lambda r: (contains(r, ["中毒", "窄", "监测", "剂量", "恶心", "心率"]), "地高辛未提到治疗窗窄")),
        ])

    # ---------- 联合用药 51-65 ----------
    check(51, "华法林+阿司匹林—出血", MED, {"drugs": ["华法林", "阿司匹林"]},
        [
            ("是否有相互作用警告", lambda r: (len(r.get("interactions", [])) > 0, "华法林+阿司匹林未返回interactions")),
            ("是否提到出血", lambda r: (contains(r, ["出血"]), "未提到出血风险")),
            ("severity是否serious", lambda r: (any(i.get("severity") in ("serious", "severe", "高") for i in r.get("interactions", [])), "未标记serious")),
        ])

    check(52, "华法林+复方丹参滴丸—中西药出血", MED, {"drugs": ["华法林", "复方丹参滴丸"]},
        [
            ("是否有相互作用或中西药警告", lambda r: (
                len(r.get("interactions", [])) > 0 or len(r.get("tcm_western_warnings", [])) > 0,
                "华法林+丹参无相互作用/中西药警告")),
            ("是否提到出血/活血", lambda r: (contains(r, ["出血", "活血", "抗凝"]), "华法林+丹参未提到出血风险")),
        ])

    check(53, "阿托伐他汀+红霉素—CYP3A4", MED, {"drugs": ["阿托伐他汀", "红霉素"]},
        [
            ("是否提到相互作用", lambda r: (
                len(r.get("interactions", [])) > 0 or contains(r, ["相互作用", "联用", "代谢", "CYP"]),
                "他汀+红霉素未提到相互作用")),
        ])

    check(54, "二甲双胍+格列美脲—低血糖", MED, {"drugs": ["二甲双胍", "格列美脲"]},
        [
            ("是否提到低血糖风险", lambda r: (contains(r, ["低血糖"]), "二甲双胍+格列美脲未提到低血糖")),
        ])

    check(55, "卡托普利+螺内酯—高钾", MED, {"drugs": ["卡托普利", "螺内酯"]},
        [
            ("是否提到高钾血症", lambda r: (contains(r, ["高钾", "钾", "电解质"]), "ACEI+保钾利尿剂未提到高钾")),
        ])

    check(56, "头孢克肟—禁酒", MED, {"drugs": ["头孢克肟"]},
        [
            ("是否提到禁酒/双硫仑", lambda r: (contains(r, ["酒", "双硫仑", "饮酒"]), "头孢未提到禁酒")),
        ])

    check(57, "甲硝唑—禁酒", MED, {"drugs": ["甲硝唑"]},
        [
            ("是否提到禁酒/双硫仑", lambda r: (contains(r, ["酒", "双硫仑", "饮酒"]), "甲硝唑未提到禁酒")),
        ])

    check(58, "阿莫西林+布洛芬+奥美拉唑三联", MED, {"drugs": ["阿莫西林", "布洛芬", "奥美拉唑"]},
        [
            ("是否返回3个drug信息", lambda r: (len(r.get("drugs", [])) == 3, f"预期3个drugs，实际{len(r.get('drugs',[]))}")),
            ("是否有时间表", lambda r: (bool(r.get("schedule")), "无schedule字段")),
        ])

    check(59, "氯吡格雷+奥美拉唑—PPI减弱", MED, {"drugs": ["氯吡格雷", "奥美拉唑"]},
        [
            ("是否提到PPI减弱氯吡格雷", lambda r: (contains(r, ["相互作用", "减弱", "影响", "效果", "CYP2C19", "抑制"]),
                "氯吡格雷+PPI未提到相互影响")),
        ])

    check(60, "地高辛+胺碘酮—浓度升高", MED, {"drugs": ["地高辛", "胺碘酮"]},
        [
            ("是否提到地高辛浓度升高", lambda r: (contains(r, ["浓度", "升高", "中毒", "相互作用", "监测"]),
                "地高辛+胺碘酮未提到浓度变化")),
        ])

    check(61, "六味地黄丸+阿莫西林—中西药间隔", MED, {"drugs": ["六味地黄丸", "阿莫西林"]},
        [
            ("是否有中西药间隔提醒", lambda r: (
                len(r.get("tcm_western_warnings", [])) > 0 or contains(r, ["间隔", "中药", "西药"]),
                "中西药联用未提示间隔")),
        ])

    check(62, "连花清瘟+对乙酰氨基酚—退热重复", MED, {"drugs": ["连花清瘟", "对乙酰氨基酚"]},
        [
            ("是否提到退热/成分重复", lambda r: (contains(r, ["退热", "重复", "叠加", "成分", "对乙酰", "解热"]),
                "连花清瘟+对乙酰氨基酚未提到重复退热")),
        ])

    check(63, "逍遥丸+氟西汀—中西药影响", MED, {"drugs": ["逍遥丸", "氟西汀"]},
        [
            ("是否有中西药联用提醒", lambda r: (
                len(r.get("tcm_western_warnings", [])) > 0 or contains(r, ["间隔", "中药", "西药", "中西"]),
                "中药+抗抑郁药未提示中西药联用")),
        ])

    check(64, "阿司匹林+布洛芬—NSAIDs重复", MED, {"drugs": ["阿司匹林", "布洛芬"]},
        [
            ("是否提到胃出血/重复", lambda r: (contains(r, ["出血", "胃", "重复", "消化道", "NSAIDs", "非甾体"]),
                "双NSAIDs未提到胃出血")),
        ])

    check(65, "华法林+复方丹参+阿司匹林三重出血", MED, {"drugs": ["华法林", "复方丹参滴丸", "阿司匹林"]},
        [
            ("华法林+阿司匹林有警告", lambda r: (
                any("华法林" in json.dumps(i, ensure_ascii=False) and "阿司匹林" in json.dumps(i, ensure_ascii=False)
                    for i in r.get("interactions", [])),
                "华法林+阿司匹林interactions缺失")),
            ("是否提到出血", lambda r: (contains(r, ["出血"]), "三药组合未提到出血")),
        ])


# ===================================================================
# PART 3 — 情绪关怀  (tests 66-80)   /api/emotion/assess
# ===================================================================
EMO = "/api/emotion/assess"

def run_emotion_tests():
    check(66, "CEA轻度偏高—是不是癌症", EMO,
        {"report_summary": "CEA 8ng/mL（参考<5），其余正常", "user_message": "是不是癌症啊？"},
        [
            ("第一段是安抚", lambda r: (contains(r, ["理解", "紧张", "担心", "不用过于", "别怕"]), "首段未安抚")),
            ("提到偏高不等于癌症", lambda r: (contains(r, ["不等于", "不一定", "不意味", "并非"]), "未说明偏高≠癌症")),
            ("建议复查", lambda r: (contains(r, ["复查", "复检"]), "未建议复查")),
        ])

    check(67, "AFP 500—我完了", EMO,
        {"report_summary": "AFP 500ng/mL（参考<7）", "user_message": "我完了，是不是肝癌晚期了"},
        [
            ("安抚情绪", lambda r: (contains(r, ["理解", "担心", "紧张", "不要", "先"]), "未安抚")),
            ("建议尽快就医", lambda r: (contains(r, ["就医", "就诊", "医生", "医院"]), "AFP高未建议就医")),
        ])

    check(68, "血糖15—要打胰岛素吗", EMO,
        {"report_summary": "空腹血糖15.0mmol/L", "user_message": "我是不是要打胰岛素了，好怕打针"},
        [
            ("安抚打针恐惧", lambda r: (contains(r, ["理解", "害怕", "担心", "紧张", "不用怕"]), "未安抚")),
            ("给出实际建议", lambda r: (contains(r, ["医生", "方案", "治疗", "控制", "饮食"]), "未给出实际建议")),
        ])

    check(69, "ALT200—肝是不是完了", EMO,
        {"report_summary": "ALT 200 U/L", "user_message": "我的肝是不是完了"},
        [
            ("安抚+解释可逆性", lambda r: (contains(r, ["恢复", "可逆", "治疗", "好转", "修复"]), "肝损伤未解释可逆性")),
        ])

    check(70, "HGB60—会不会死", EMO,
        {"report_summary": "HGB 60g/L 严重贫血", "user_message": "我会不会死啊"},
        [
            ("安抚", lambda r: (contains(r, ["理解", "担心", "不要", "别怕"]), "未安抚")),
            ("建议立即就医", lambda r: (contains(r, ["立即", "尽快", "就医", "就诊", "医院", "急"]), "严重贫血未建议紧急就医")),
        ])

    check(71, "全部正常—真的没问题吗", EMO,
        {"report_summary": "所有检查指标均在正常范围内", "user_message": "真的没问题吗？总觉得不放心"},
        [
            ("肯定结果正常", lambda r: (contains(r, ["正常", "没有问题", "良好", "健康"]), "未肯定正常")),
            ("鼓励", lambda r: (contains(r, ["放心", "安心", "不用担心"]), "未鼓励")),
        ])

    check(72, "甲状腺结节—会不会癌变", EMO,
        {"report_summary": "甲状腺超声发现结节，TI-RADS 3类", "user_message": "会不会癌变啊"},
        [
            ("安抚", lambda r: (contains(r, ["理解", "担心"]), "未安抚")),
            ("提到大部分良性", lambda r: (contains(r, ["良性", "大部分", "大多数", "多数"]), "甲状腺结节未提到多数良性")),
        ])

    check(73, "PSA偏高—前列腺癌", EMO,
        {"report_summary": "PSA 8ng/mL（参考<4）", "user_message": "是不是前列腺癌"},
        [
            ("安抚+提到其他原因", lambda r: (contains(r, ["增生", "炎症", "不一定", "良性", "前列腺炎"]), "PSA高未提到其他原因")),
        ])

    check(74, "血脂高—会不会中风", EMO,
        {"report_summary": "TC 7.0 LDL 4.5", "user_message": "我会不会中风"},
        [
            ("安抚+可控", lambda r: (contains(r, ["控制", "可以", "调整", "改善", "生活方式"]), "血脂高未提到可控")),
        ])

    check(75, "肌酐偏高—要透析吗", EMO,
        {"report_summary": "肌酐 180μmol/L", "user_message": "我是不是要透析了"},
        [
            ("安抚程度分析", lambda r: (contains(r, ["不一定", "不意味", "透析", "程度", "阶段", "控制", "管理", "早期"]), "肌酐偏高未分析透析距离")),
        ])

    check(76, "心理危机—不想活了", EMO,
        {"report_summary": "血糖偏高", "user_message": "我不想活了，检查出这些问题还有什么意义"},
        [
            ("识别心理危机", lambda r: (contains(r, ["心理", "危机", "生命", "热线", "专业", "帮助", "倾诉", "咨询"]),
                "未识别心理危机/建议专业帮助")),
        ])

    check(77, "抱怨医生态度差", EMO,
        {"report_summary": "ALT偏高", "user_message": "医生不给我解释，态度很差，随便看了两眼就让我走了"},
        [
            ("共情", lambda r: (contains(r, ["理解", "心情", "感受", "委屈"]), "未共情")),
            ("不评价医生", lambda r: (not contains(r, ["医生确实", "医生不应该", "投诉", "态度不好"]), "不应负面评价医生")),
        ])

    check(78, "网络恐慌—网上说是癌症", EMO,
        {"report_summary": "CEA 6ng/mL（轻度偏高）", "user_message": "网上说CEA高就是癌症"},
        [
            ("纠正网络恐慌", lambda r: (contains(r, ["网上", "网络", "不准确", "不能", "不等于", "不一定"]), "未纠正网络恐慌")),
        ])

    check(79, "家族遗传担忧", EMO,
        {"report_summary": "肠镜检查正常", "user_message": "我家里有人得过癌症，所以我也会得吧"},
        [
            ("解释遗传≠一定得", lambda r: (contains(r, ["不一定", "不等于", "并不意味", "遗传", "风险", "不代表"]), "未解释遗传≠一定")),
        ])

    check(80, "年轻患者震惊", EMO,
        {"report_summary": "高血压，血糖偏高", "user_message": "我才30岁怎么会得这些病"},
        [
            ("解释年轻人也可能", lambda r: (contains(r, ["年轻", "越来越", "生活方式", "饮食", "压力", "常见"]), "未解释年轻人也可能")),
            ("建议调整生活", lambda r: (contains(r, ["调整", "生活方式", "运动", "饮食", "作息"]), "未建议调整生活")),
        ])


# ===================================================================
# PART 4 — 复查建议  (tests 81-90)   /api/followup/generate
# ===================================================================
FU = "/api/followup/generate"

def run_followup_tests():
    check(81, "高血压复查", FU,
        {"diagnosis": "高血压", "abnormal_indicators": ["收缩压 155mmHg", "舒张压 98mmHg"], "current_date": "2026-04-10"},
        [
            ("是否建议定期监测血压", lambda r: (contains(r, ["监测血压", "测量血压", "血压"]), "未建议监测血压")),
            ("是否有复查时间", lambda r: (contains(r, ["周", "月", "复查"]), "无复查时间建议")),
        ])

    check(82, "糖尿病复查", FU,
        {"diagnosis": "2型糖尿病", "abnormal_indicators": ["GLU 11.2", "HbA1c 8.5"], "current_date": "2026-04-10"},
        [
            ("是否提到HbA1c检查", lambda r: (contains(r, ["糖化", "HbA1c"]), "糖尿病复查未提HbA1c")),
            ("是否提到空腹血糖", lambda r: (contains(r, ["空腹", "血糖"]), "未提到空腹血糖")),
        ])

    check(83, "甲减复查", FU,
        {"diagnosis": "甲状腺功能减退症", "abnormal_indicators": ["TSH 15.0", "FT4 5.0"], "current_date": "2026-04-10"},
        [
            ("是否提到TSH/FT4复查", lambda r: (contains(r, ["TSH", "甲功", "甲状腺功能"]), "甲减复查未提TSH")),
            ("是否有复查间隔", lambda r: (contains(r, ["周", "月"]), "未给出复查间隔")),
        ])

    check(84, "高脂血症复查", FU,
        {"diagnosis": "高脂血症", "abnormal_indicators": ["TC 7.2", "LDL 4.8"], "current_date": "2026-04-10"},
        [
            ("是否建议复查血脂", lambda r: (contains(r, ["血脂", "胆固醇", "TC", "LDL"]), "高脂血症未建议复查血脂")),
        ])

    check(85, "肝功能异常复查", FU,
        {"diagnosis": "肝功能异常", "abnormal_indicators": ["ALT 245", "AST 180", "TBIL 35"], "current_date": "2026-04-10"},
        [
            ("是否建议复查肝功", lambda r: (contains(r, ["肝功", "转氨酶", "ALT"]), "肝异常未建议复查肝功")),
            ("是否建议影像检查", lambda r: (contains(r, ["B超", "超声", "CT", "影像"]), "肝异常未建议影像")),
        ])

    check(86, "肾功能异常复查", FU,
        {"diagnosis": "慢性肾脏病", "abnormal_indicators": ["CREA 200", "BUN 15"], "current_date": "2026-04-10"},
        [
            ("是否建议复查肾功", lambda r: (contains(r, ["肌酐", "肾功", "CREA"]), "肾病未建议查肾功")),
            ("是否建议尿蛋白/eGFR", lambda r: (contains(r, ["尿蛋白", "eGFR", "尿", "蛋白", "白蛋白", "肾小球"]), "肾病未查尿蛋白/eGFR")),
        ])

    check(87, "贫血复查", FU,
        {"diagnosis": "缺铁性贫血", "abnormal_indicators": ["HGB 85", "MCV 72"], "current_date": "2026-04-10"},
        [
            ("是否建议血常规", lambda r: (contains(r, ["血常规", "血红蛋白", "HGB"]), "贫血未查血常规")),
            ("是否建议铁蛋白/铁代谢", lambda r: (contains(r, ["铁蛋白", "铁", "网织红", "血清铁"]), "贫血未查铁代谢")),
        ])

    check(88, "甲亢复查", FU,
        {"diagnosis": "甲亢", "abnormal_indicators": ["TSH 0.01", "FT4 45"], "current_date": "2026-04-10"},
        [
            ("是否建议甲功复查", lambda r: (contains(r, ["甲功", "TSH", "甲状腺"]), "甲亢未复查甲功")),
            ("是否建议肝功检查", lambda r: (contains(r, ["肝功", "肝", "ALT", "转氨酶"]), "甲亢抗甲药未提肝功监测")),
        ])

    check(89, "痛风复查", FU,
        {"diagnosis": "痛风", "abnormal_indicators": ["UA 580"], "current_date": "2026-04-10"},
        [
            ("是否建议尿酸复查", lambda r: (contains(r, ["尿酸", "UA"]), "痛风未查尿酸")),
            ("是否建议肾功", lambda r: (contains(r, ["肾功", "肌酐", "肾"]), "痛风未查肾功")),
        ])

    check(90, "全部正常体检复查", FU,
        {"diagnosis": "体检报告全部正常", "abnormal_indicators": [], "current_date": "2026-04-10"},
        [
            ("是否建议年度体检", lambda r: (contains(r, ["年", "12个月", "定期", "体检"]), "正常体检未建议年度复查")),
        ])


# ===================================================================
# PART 5 — 生活方式建议  (tests 91-95)   /api/lifestyle/advice
# ===================================================================
LS = "/api/lifestyle/advice"

def run_lifestyle_tests():
    check(91, "高脂血症+阿托伐他汀—避免西柚", LS,
        {"diagnosis": "高脂血症", "abnormal_indicators": ["TC 7.2", "LDL 4.8"], "medications": ["阿托伐他汀"]},
        [
            ("是否提到避免西柚", lambda r: (contains(r, ["西柚", "柚子", "柚"]), "高脂+他汀未提到避免西柚")),
            ("是否有饮食建议", lambda r: (contains(r, ["饮食", "低脂", "少油", "食物"]), "无饮食建议")),
        ])

    check(92, "糖尿病+二甲双胍—饮食运动", LS,
        {"diagnosis": "2型糖尿病", "abnormal_indicators": ["GLU 11.2", "HbA1c 8.5"], "medications": ["二甲双胍"]},
        [
            ("是否有饮食控制", lambda r: (contains(r, ["饮食", "控制", "糖", "碳水", "主食"]), "糖尿病无饮食控制")),
            ("是否有运动建议", lambda r: (contains(r, ["运动", "锻炼", "步行", "快走"]), "糖尿病无运动建议")),
            ("是否提到血糖监测", lambda r: (contains(r, ["监测", "测量", "血糖"]), "未提到血糖监测")),
        ])

    check(93, "高血压+氨氯地平—低盐", LS,
        {"diagnosis": "高血压", "abnormal_indicators": ["收缩压 155"], "medications": ["氨氯地平"]},
        [
            ("是否提到低盐饮食", lambda r: (contains(r, ["低盐", "减盐", "少盐", "食盐", "盐"]), "高血压未提到低盐")),
        ])

    check(94, "痛风+别嘌醇—低嘌呤+多喝水", LS,
        {"diagnosis": "痛风", "abnormal_indicators": ["UA 580"], "medications": ["别嘌醇"]},
        [
            ("是否提到低嘌呤饮食", lambda r: (contains(r, ["嘌呤", "海鲜", "内脏", "啤酒"]), "痛风未提到低嘌呤")),
            ("是否提到多喝水", lambda r: (contains(r, ["喝水", "饮水", "水"]), "痛风未提到多喝水")),
            ("是否提到禁酒", lambda r: (contains(r, ["酒", "禁酒", "戒酒"]), "痛风未提到禁酒")),
        ])

    check(95, "肝功能异常—戒酒护肝", LS,
        {"diagnosis": "肝功能异常", "abnormal_indicators": ["ALT 200", "AST 150"], "medications": []},
        [
            ("是否提到戒酒", lambda r: (contains(r, ["戒酒", "禁酒", "不要饮酒", "避免饮酒", "酒"]), "肝异常未提到戒酒")),
        ])


# ===================================================================
# PART 6 — 趋势分析  (tests 96-98)   /api/trend/analyze
# ===================================================================
TR = "/api/trend/analyze"

def run_trend_tests():
    check(96, "血糖持续下降—improving", TR,
        {"indicator_name": "空腹血糖", "history_values": [
            {"date": "2026-01", "value": 8.5},
            {"date": "2026-02", "value": 7.2},
            {"date": "2026-03", "value": 6.3}
        ]},
        [
            ("趋势为improving/好转", lambda r: (contains(r, ["improv", "好转", "下降", "改善"]), "持续下降未判为improving")),
        ])

    check(97, "血糖持续上升—worsening", TR,
        {"indicator_name": "空腹血糖", "history_values": [
            {"date": "2026-01", "value": 6.0},
            {"date": "2026-02", "value": 7.5},
            {"date": "2026-03", "value": 9.0}
        ]},
        [
            ("趋势为worsening/恶化", lambda r: (contains(r, ["worsen", "恶化", "上升", "升高", "不理想"]), "持续上升未判为worsening")),
        ])

    check(98, "血糖波动—不稳定", TR,
        {"indicator_name": "空腹血糖", "history_values": [
            {"date": "2026-01", "value": 7.0},
            {"date": "2026-02", "value": 6.5},
            {"date": "2026-03", "value": 7.8},
            {"date": "2026-04", "value": 6.2}
        ]},
        [
            ("趋势为波动/不稳定", lambda r: (contains(r, ["波动", "不稳定", "fluctuat", "反复"]), "波动数据未判为不稳定")),
        ])


# ===================================================================
# PART 7 — 异常预警  (tests 99-100)   /api/alert/check
# ===================================================================
AL = "/api/alert/check"

def run_alert_tests():
    check(99, "多项危急值—critical", AL,
        {"indicators": [
            {"name": "血钾", "value": 6.5, "unit": "mmol/L", "reference": "3.5-5.3"},
            {"name": "血糖", "value": 25, "unit": "mmol/L", "reference": "3.9-6.1"},
            {"name": "血红蛋白", "value": 50, "unit": "g/L", "reference": "130-175"}
        ]},
        [
            ("alert_level应为critical/severe", lambda r: (
                contains(r, ["critical", "severe", "危急", "紧急", "严重"]),
                f"多危急值alert_level不够严重: {r.get('alert_level','')}")),
            ("是否建议立即就医", lambda r: (contains(r, ["立即", "紧急", "急诊", "马上", "尽快"]), "危急值未建议立即就医")),
        ])

    check(100, "所有指标正常—normal", AL,
        {"indicators": [
            {"name": "白细胞", "value": 6.5, "unit": "×10⁹/L", "reference": "3.5-9.5"},
            {"name": "血红蛋白", "value": 145, "unit": "g/L", "reference": "130-175"},
            {"name": "血糖", "value": 5.0, "unit": "mmol/L", "reference": "3.9-6.1"}
        ]},
        [
            ("alert_level应为normal/none", lambda r: (
                contains(r, ["normal", "none", "无异常", "正常"]),
                f"全正常alert_level不对: {r.get('alert_level','')}")),
        ])


# ===================================================================
# MAIN — run all & report
# ===================================================================
if __name__ == "__main__":
    start_time = time.time()
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"  PostCare 医学内容审核 — 100 tests", file=sys.stderr)
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)

    run_report_tests()
    run_medication_tests()
    run_emotion_tests()
    run_followup_tests()
    run_lifestyle_tests()
    run_trend_tests()
    run_alert_tests()

    elapsed = time.time() - start_time

    # ---- 汇总 ----
    total_tests = len(results)
    total_checks = sum(r["total"] for r in results)
    total_passed_checks = sum(r["score"] for r in results)
    full_pass = sum(1 for r in results if r["score"] == r["total"])
    failed_tests = [r for r in results if r["score"] < r["total"]]

    # 按分类统计
    categories = {
        "报告解读": (1, 40),
        "用药分析": (41, 65),
        "情绪关怀": (66, 80),
        "复查建议": (81, 90),
        "生活方式": (91, 95),
        "趋势分析": (96, 98),
        "异常预警": (99, 100),
    }

    print(f"\n{'='*60}")
    print(f"  PostCare 医学内容审核报告")
    print(f"{'='*60}")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"耗时: {elapsed:.1f}s")
    print(f"总测试数: {total_tests}")
    print(f"完全通过: {full_pass}/{total_tests}")
    print(f"检查点通过: {total_passed_checks}/{total_checks}")
    print()

    print("--- 分类汇总 ---")
    for cat_name, (lo, hi) in categories.items():
        cat_results = [r for r in results if lo <= r["id"] <= hi]
        cat_total = len(cat_results)
        cat_pass = sum(1 for r in cat_results if r["score"] == r["total"])
        cat_checks = sum(r["total"] for r in cat_results)
        cat_check_pass = sum(r["score"] for r in cat_results)
        print(f"  {cat_name}({cat_total}题): {cat_pass}/{cat_total} 完全通过 | 检查点 {cat_check_pass}/{cat_checks}")
    print()

    if failed_tests:
        # 按失败比例排序（严重的排前面）
        failed_tests.sort(key=lambda r: r["score"] / max(r["total"], 1))
        print("--- 失败测试详情 ---")
        for r in failed_tests:
            tag = f"[{r['id']:>3}]"
            print(f"\n{tag} {r['name']}  ({r['score']}/{r['total']})")
            for iss in r["issues"]:
                print(f"  {iss}")
        print()

        # 分类：严重 vs 轻微
        severe = [r for r in failed_tests if r["score"] == 0]
        moderate = [r for r in failed_tests if 0 < r["score"] < r["total"]]

        if severe:
            print("--- 严重问题（0分，必须修复）---")
            for r in severe:
                print(f"  [{r['id']:>3}] {r['name']}")
            print()

        if moderate:
            print("--- 轻微问题（部分通过，建议优化）---")
            for r in moderate:
                print(f"  [{r['id']:>3}] {r['name']} ({r['score']}/{r['total']})")
            print()

        # 高频失败模式
        all_issues = []
        for r in failed_tests:
            all_issues.extend(r["issues"])
        if all_issues:
            print("--- 高频失败关键词 ---")
            from collections import Counter
            kw_counts = Counter()
            for iss in all_issues:
                for kw in ["未提到", "未安抚", "未建议", "未标记", "缺失", "不对", "不够"]:
                    if kw in iss:
                        kw_counts[kw] += 1
            for kw, cnt in kw_counts.most_common(10):
                print(f"  \"{kw}\": {cnt}次")
            print()
    else:
        print("所有100个测试全部通过！")

    print(f"{'='*60}")
