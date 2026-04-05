from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import io
import logging
from dotenv import load_dotenv

load_dotenv()

from agents import report, medication, followup, profile, chat, journey
from agents import pre_visit, pre_visit_checklist, emotion, lifestyle, trend, alert, revisit_report
from services import ocr, tts, stt

logger = logging.getLogger(__name__)

app = FastAPI(title="PostCare API", description="诊后患者AI守护Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== 检查报告解读 ==========
@app.post("/api/report/analyze")
async def analyze_report(data: dict):
    """文本输入的报告解读"""
    try:
        result = await report.analyze(data["text"])
        return result
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/report/analyze 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "报告解读服务异常，请稍后重试", "detail": str(e)})


@app.post("/api/report/ocr")
async def analyze_report_ocr(image: UploadFile = File(...)):
    """图片上传 -> OCR -> 解读"""
    try:
        image_bytes = await image.read()
        text = await ocr.extract_text(image_bytes)
        result = await report.analyze(text)
        result["ocr_text"] = text
        return result
    except Exception as e:
        logger.error(f"/api/report/ocr 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "OCR识别或报告解读失败，请稍后重试", "detail": str(e)})


# ========== 用药管家 ==========
@app.post("/api/medication/analyze")
async def analyze_medication(data: dict):
    """输入药品列表，返回用药指导"""
    try:
        result = await medication.analyze(data["drugs"])
        return result
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/medication/analyze 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "用药分析服务异常，请稍后重试", "detail": str(e)})


# ========== 复查提醒 ==========
@app.post("/api/followup/generate")
async def generate_followup(data: dict):
    """基于诊断和异常指标生成复查建议"""
    try:
        result = await followup.generate(
            diagnosis=data.get("diagnosis", ""),
            abnormal_indicators=data.get("abnormal_indicators", []),
            current_date=data.get("current_date", "")
        )
        return result
    except Exception as e:
        logger.error(f"/api/followup/generate 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "复查建议生成失败，请稍后重试", "detail": str(e)})


# ========== 病情档案卡 ==========
@app.post("/api/profile/generate")
async def generate_profile(data: dict):
    """整合报告+用药+复查，生成一页纸摘要"""
    try:
        result = await profile.generate(
            report_summary=data.get("report_summary", {}),
            medications=data.get("medications", []),
            followup_plan=data.get("followup_plan", {})
        )
        return result
    except Exception as e:
        logger.error(f"/api/profile/generate 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "病情档案卡生成失败，请稍后重试", "detail": str(e)})


# ========== 多轮对话 ==========
@app.post("/api/chat")
async def chat_endpoint(data: dict):
    """基于上下文的追问对话"""
    try:
        result = await chat.ask(
            message=data["message"],
            context=data.get("context", {}),
            history=data.get("history", [])
        )
        return result
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/chat 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "对话服务异常，请稍后重试", "detail": str(e)})


# ========== 语音 ==========
@app.post("/api/voice/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """语音转文字"""
    try:
        audio_bytes = await audio.read()
        text = await stt.recognize(audio_bytes)
        return {"text": text}
    except Exception as e:
        logger.error(f"/api/voice/stt 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "语音识别失败，请稍后重试", "detail": str(e)})


@app.post("/api/voice/tts")
async def text_to_speech(data: dict):
    """文字转语音"""
    try:
        audio_bytes = await tts.synthesize(data["text"])
        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/voice/tts 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "语音合成失败，请稍后重试", "detail": str(e)})


# ========== 诊前预问诊 ==========
@app.post("/api/pre-visit/interview")
async def pre_visit_interview(data: dict):
    """预问诊：整理症状为结构化报告"""
    try:
        return await pre_visit.interview(data["symptoms"], data.get("history", ""))
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/pre-visit/interview 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "预问诊服务异常，请稍后重试", "detail": str(e)})


@app.post("/api/pre-visit/checklist")
async def pre_visit_checklist_endpoint(data: dict):
    """就诊准备清单"""
    try:
        return await pre_visit_checklist.generate(data["department"], data.get("symptoms", ""))
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/pre-visit/checklist 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "就诊准备清单生成失败，请稍后重试", "detail": str(e)})


# ========== 情绪关怀 ==========
@app.post("/api/emotion/assess")
async def emotion_assess(data: dict):
    """评估情绪并安抚患者"""
    try:
        return await emotion.assess_and_comfort(data["report_summary"], data.get("user_message", ""))
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/emotion/assess 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "情绪评估服务异常，请稍后重试", "detail": str(e)})


# ========== 生活方式建议 ==========
@app.post("/api/lifestyle/advice")
async def lifestyle_advice(data: dict):
    """个性化生活方式建议"""
    try:
        return await lifestyle.generate(
            data.get("diagnosis", ""),
            data.get("abnormal_indicators", []),
            data.get("medications", [])
        )
    except Exception as e:
        logger.error(f"/api/lifestyle/advice 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "生活方式建议生成失败，请稍后重试", "detail": str(e)})


# ========== 指标趋势追踪 ==========
@app.post("/api/trend/analyze")
async def trend_analyze(data: dict):
    """分析指标历史变化趋势"""
    try:
        return await trend.analyze(data["indicator_name"], data["history_values"])
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/trend/analyze 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "趋势分析服务异常，请稍后重试", "detail": str(e)})


# ========== 异常预警 ==========
@app.post("/api/alert/check")
async def alert_check(data: dict):
    """检查指标异常预警"""
    try:
        return await alert.check(data["indicators"])
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/alert/check 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "异常预警服务异常，请稍后重试", "detail": str(e)})


# ========== 复诊报告 ==========
@app.post("/api/revisit/generate")
async def revisit_generate(data: dict):
    """对比两次报告，生成复诊汇报"""
    try:
        return await revisit_report.generate(
            original_report=data.get("original_report", {}),
            new_report=data.get("new_report", {}),
            medications=data.get("medications", []),
            symptoms_update=data.get("symptoms_update", "")
        )
    except Exception as e:
        logger.error(f"/api/revisit/generate 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "复诊汇报生成失败，请稍后重试", "detail": str(e)})


# ========== 一站式全流程 ==========
@app.post("/api/journey/full")
async def journey_full(data: dict):
    """一站式全流程：报告 -> 用药 -> 复查 -> 生活方式 -> 情绪 -> 档案卡"""
    try:
        result = await journey.full_journey(
            report_text=data["report_text"],
            user_note=data.get("user_note", "")
        )
        return result
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/journey/full 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "全流程分析服务异常，请稍后重试", "detail": str(e)})


# ========== 流式对话 ==========
@app.post("/api/chat/stream")
async def chat_stream(data: dict):
    """流式多轮对话"""
    try:
        return StreamingResponse(
            chat.ask_stream(
                message=data["message"],
                context=data.get("context", {}),
                history=data.get("history", [])
            ),
            media_type="text/event-stream"
        )
    except KeyError as e:
        return JSONResponse(status_code=422, content={"error": f"缺少必填字段: {str(e)}"})
    except Exception as e:
        logger.error(f"/api/chat/stream 错误: {e}")
        return JSONResponse(status_code=500, content={"error": "流式对话服务异常，请稍后重试", "detail": str(e)})


# ========== 健康检查 ==========
@app.get("/health")
async def health():
    return {"status": "ok"}
