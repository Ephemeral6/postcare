const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://ephemeral.zeabur.app';

async function post(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postFile(endpoint: string, file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ===== 诊前 =====
export const preVisitInterview = (symptoms: string, history?: string) =>
  post('/api/pre-visit/interview', { symptoms, history });

export const preVisitChecklist = (department: string, symptoms?: string) =>
  post('/api/pre-visit/checklist', { department, symptoms });

// ===== 诊后 =====
export const analyzeReport = (text: string) =>
  post('/api/report/analyze', { text });

export const analyzeReportOCR = (file: File) =>
  postFile('/api/report/ocr', file);

export const assessEmotion = (reportSummary: string, userMessage?: string) =>
  post('/api/emotion/assess', { report_summary: reportSummary, user_message: userMessage });

// ===== 回家管理 =====
export const analyzeMedication = (drugs: string[]) =>
  post('/api/medication/analyze', { drugs });

export const generateFollowup = (diagnosis: string, abnormalIndicators: unknown[], currentDate?: string) =>
  post('/api/followup/generate', { diagnosis, abnormal_indicators: abnormalIndicators, current_date: currentDate });

export const lifestyleAdvice = (diagnosis: string, abnormalIndicators: unknown[], medications: unknown[]) =>
  post('/api/lifestyle/advice', { diagnosis, abnormal_indicators: abnormalIndicators, medications });

export const chat = (message: string, context?: unknown, history?: unknown[]) =>
  post('/api/chat', { message, context, history });

// ===== 追踪 =====
export const analyzeTrend = (indicatorName: string, historyValues: unknown[]) =>
  post('/api/trend/analyze', { indicator_name: indicatorName, history_values: historyValues });

export const checkAlert = (indicators: unknown[]) =>
  post('/api/alert/check', { indicators });

// ===== 复诊 =====
export const generateRevisit = (originalReport: unknown, newReport: unknown, medications: string[], symptomsUpdate?: string) =>
  post('/api/revisit/generate', { original_report: originalReport, new_report: newReport, medications, symptoms_update: symptomsUpdate });

// ===== 全旅程 =====
export const fullJourney = (reportText: string, userNote?: string) =>
  post('/api/journey/full', { report_text: reportText, user_note: userNote });

// ===== 语音 =====
export const textToSpeech = async (text: string): Promise<Blob> => {
  const res = await fetch(`${API_BASE}/api/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.blob();
};
