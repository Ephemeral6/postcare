"""医学内容审核 - 自动化测试脚本"""
import json
import urllib.request
import sys
import io

# Fix Windows GBK encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

BASE = "http://localhost:8000"

def call_api(path, data):
    """调用API并返回JSON结果"""
    url = f"{BASE}{path}"
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"_error": str(e)}

def run_test(test_num, name, path, payload):
    print(f"\n{'='*60}")
    print(f"TEST {test_num}: {name}")
    print(f"{'='*60}")
    result = call_api(path, payload)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"

    if which in ("1", "all"):
        run_test(1, "血常规异常", "/api/report/analyze", {
            "text": "白细胞计数(WBC) 15.8 3.5-9.5 ×10⁹/L\n中性粒细胞比率(NEUT%) 85.2 40-75 %\n血红蛋白(HGB) 95 130-175 g/L\n血小板计数(PLT) 450 125-350 ×10⁹/L"
        })

    if which in ("2", "all"):
        run_test(2, "肝功能异常", "/api/report/analyze", {
            "text": "谷丙转氨酶(ALT) 245 0-40 U/L\n谷草转氨酶(AST) 180 0-40 U/L\n总胆红素(TBIL) 35.6 0-21 μmol/L\n白蛋白(ALB) 30.5 40-55 g/L"
        })

    if which in ("3", "all"):
        run_test(3, "糖尿病典型报告", "/api/report/analyze", {
            "text": "空腹血糖(GLU) 11.2 3.9-6.1 mmol/L\n糖化血红蛋白(HbA1c) 8.5 4-6 %"
        })

    if which in ("4", "all"):
        run_test(4, "肾功能异常", "/api/report/analyze", {
            "text": "肌酐(CREA) 186 44-133 μmol/L\n尿素氮(BUN) 12.5 2.6-7.5 mmol/L\n尿酸(UA) 520 208-428 μmol/L"
        })

    if which in ("5", "all"):
        run_test(5, "全部正常报告", "/api/report/analyze", {
            "text": "白细胞计数(WBC) 6.5 3.5-9.5 ×10⁹/L\n血红蛋白(HGB) 150 130-175 g/L\n谷丙转氨酶(ALT) 25 0-40 U/L\n空腹血糖(GLU) 5.2 3.9-6.1 mmol/L"
        })

    if which in ("6", "all"):
        run_test(6, "常见心血管组合", "/api/medication/analyze", {
            "drugs": ["阿司匹林", "阿托伐他汀", "硝苯地平"]
        })

    if which in ("7", "all"):
        run_test(7, "中西药联用", "/api/medication/analyze", {
            "drugs": ["华法林", "复方丹参滴丸", "阿司匹林"]
        })

    if which in ("8", "all"):
        run_test(8, "降糖药组合", "/api/medication/analyze", {
            "drugs": ["二甲双胍", "格列美脲", "阿卡波糖"]
        })

    if which in ("9", "all"):
        run_test(9, "肿瘤标志物偏高-情绪关怀", "/api/emotion/assess", {
            "report_summary": "肿瘤标志物CEA 12.5ng/mL（参考<5），CA199 45U/mL（参考<37），AFP正常",
            "user_message": "两个肿瘤标志物都高了，我是不是没救了"
        })

    if which in ("10", "all"):
        run_test(10, "糖尿病复查建议", "/api/followup/generate", {
            "diagnosis": "2型糖尿病",
            "abnormal_indicators": ["GLU 11.2", "HbA1c 8.5"],
            "current_date": "2026-04-10"
        })
