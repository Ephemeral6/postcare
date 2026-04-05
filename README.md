# PostCare — 患者的全旅程AI守护者

> 让每一个患者出了诊室，都不再孤单。

PostCare是一个覆盖完整就医旅程的AI守护Agent，从诊前预问诊到复诊报告生成，用AI帮医生把"诊室里来不及说的话"补上。

## 功能覆盖

- 🏥 诊前准备：预问诊 + 就诊清单
- 📋 报告解读：检查报告通俗化解读 + 情绪关怀
- 💊 用药管家：用药指导 + 药物相互作用 + 中西药联用提醒
- 🏠 回家管理：复查提醒 + 生活方式建议 + AI追问对话
- 📈 健康追踪：指标趋势分析 + 异常预警
- 📄 复诊准备：前后对比报告 + 医生简报

## 技术栈

- 后端：FastAPI + DeepSeek API + PaddleOCR + edge-tts + whisper
- 前端：Next.js 14 + TailwindCSS + shadcn/ui + Recharts
- 知识库：200种药物 + 150项检查指标 + 200对药物相互作用

## 快速启动

### 后端
```bash
cd postcare-api
pip install -r requirements.txt
cp .env.example .env  # 填入DeepSeek API Key
uvicorn main:app --reload --port 8000
```

### 前端
```bash
cd postcare-web
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 项目背景

Ultra Maker Hackathon 2026 北京站参赛项目。
