'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  ClipboardPaste,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  X,
  ImagePlus,
  Users,
  User,
  Phone,
} from 'lucide-react';
import { analyzeReport, analyzeReportOCR, assessEmotion } from '@/lib/api';
import type { ReportResult, Indicator, EmotionResult } from '@/lib/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SeverityBadge from '@/components/shared/SeverityBadge';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';

const SAMPLE_REPORT = `检验报告单
姓名：张三  性别：男  年龄：45岁
白细胞计数(WBC)    11.2     3.5-9.5      ×10⁹/L
红细胞计数(RBC)    4.8      4.3-5.8      ×10¹²/L
血红蛋白(HGB)      145      130-175      g/L
血小板计数(PLT)    180      125-350      ×10⁹/L
谷丙转氨酶(ALT)    85       0-40         U/L
谷草转氨酶(AST)    62       0-40         U/L
总胆固醇(TC)       6.8      0-5.2        mmol/L
甘油三酯(TG)       2.5      0-1.7        mmol/L
空腹血糖(GLU)      6.3      3.9-6.1      mmol/L`;

// --- IndicatorBar component ---
function IndicatorBar({ indicator }: { indicator: Indicator }) {
  const { value, reference_low, reference_high, status } = indicator;
  const min = reference_low ?? 0;
  const max = reference_high ?? value * 2;
  const range = max - min;

  const displayMin = min - range * 0.3;
  const displayMax = max + range * 0.3;
  const displayRange = displayMax - displayMin;

  const clampedValue = Math.max(displayMin, Math.min(displayMax, value));
  const dotPosition = ((clampedValue - displayMin) / displayRange) * 100;

  const rangeLeft = ((min - displayMin) / displayRange) * 100;
  const rangeRight = ((max - displayMin) / displayRange) * 100;

  const isNormal = status === 'normal';
  const dotColor = isNormal ? 'var(--success)' : status === 'critical' ? 'var(--danger)' : 'var(--warning)';

  return (
    <div className="mt-2 mb-1">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-gray-100 overflow-visible">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${rangeLeft}%`,
            width: `${rangeRight - rangeLeft}%`,
            background: isNormal ? 'var(--success-light)' : '#F1F5F9',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-500"
          style={{
            left: `${dotPosition}%`,
            backgroundColor: dotColor,
          }}
        />
      </div>
      <div
        className="text-[10px] mt-0.5 transition-all duration-500"
        style={{
          marginLeft: `${Math.max(5, Math.min(85, dotPosition - 5))}%`,
          color: dotColor,
        }}
      >
        {value} {indicator.unit}
      </div>
    </div>
  );
}

// --- Indicator Card ---
function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const isNormal = indicator.status === 'normal';
  const [expanded, setExpanded] = useState(!isNormal);

  const borderColor =
    indicator.status === 'critical'
      ? 'border-l-red-500'
      : indicator.status === 'normal'
        ? 'border-l-green-500'
        : 'border-l-amber-500';

  const valueColor =
    indicator.status === 'critical'
      ? 'var(--danger)'
      : indicator.status === 'normal'
        ? 'var(--success)'
        : 'var(--warning)';

  return (
    <div className={`relative bg-white rounded-xl border border-gray-100 border-l-4 ${borderColor} overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-gray-900 text-sm truncate">{indicator.name}</span>
          <SeverityBadge severity={indicator.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular-nums font-bold text-lg" style={{ color: valueColor }}>
            {indicator.value}
          </span>
          <span className="text-xs text-gray-400">{indicator.unit}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-4 space-y-3">
          <IndicatorBar indicator={indicator} />

          {indicator.explanation && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-900 leading-relaxed">{indicator.explanation}</p>
            </div>
          )}

          {indicator.suggestion && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <Heart className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-900 leading-relaxed">{indicator.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Emotion Care Modal ---
function EmotionModal({
  emotion,
  onClose,
}: {
  emotion: EmotionResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 animate-[fadeIn_0.3s_ease-out]">
      <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Blue top */}
        <div className="bg-blue-600 p-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-3xl mb-3">🤗</div>
          <h3 className="text-lg font-bold text-white mb-2">
            PostCare 关心您的感受
          </h3>
          <p className="text-sm text-blue-100 leading-relaxed">
            {emotion.comfort_message}
          </p>
        </div>
        {/* Suggestions */}
        <div className="p-5 space-y-3">
          {emotion.action_items?.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">{s}</p>
            </div>
          ))}
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            我了解了，查看详细解读 →
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Normal Indicators Collapsible ---
function NormalIndicatorsCollapsible({ indicators }: { indicators: Indicator[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </span>
          正常指标 ({indicators.length})
        </h3>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-3">
          {indicators.map((ind, i) => (
            <IndicatorCard key={`normal-${i}`} indicator={ind} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Family Mode Indicator Card ---
function IndicatorCardFamily({ indicator }: { indicator: Indicator }) {
  const [expanded, setExpanded] = useState(true);

  const borderColor =
    indicator.status === 'critical' ? 'var(--danger)' : 'var(--warning)';

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300"
      style={{ borderLeft: `5px solid ${borderColor}` }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-bold text-gray-900 text-lg">{indicator.name}</span>
          <SeverityBadge severity={indicator.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular-nums font-extrabold text-2xl" style={{ color: borderColor }}>
            {indicator.value}
          </span>
          <span className="text-sm text-gray-400">{indicator.unit}</span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 space-y-4">
          <IndicatorBar indicator={indicator} />

          {indicator.explanation && (
            <div className="flex gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
              <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-base text-gray-900 leading-[1.8]">{indicator.explanation}</p>
            </div>
          )}

          {indicator.suggestion && (
            <div className="flex gap-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
              <Heart className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-base text-gray-900 leading-[1.8]">{indicator.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Family Mode Toggle ---
function FamilyModeToggle({
  familyMode,
  onToggle,
}: {
  familyMode: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
      <button
        onClick={() => !familyMode || onToggle()}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          !familyMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <User className="w-4 h-4" />
        标准模式
      </button>
      <button
        onClick={() => familyMode || onToggle()}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          familyMode ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Users className="w-4 h-4" />
        家属模式
      </button>
    </div>
  );
}

// --- Main Page ---
export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<'text' | 'photo'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  const [showEmotion, setShowEmotion] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [familyMode, setFamilyMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith('image/')) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  const handleSubmit = async () => {
    if (activeTab === 'text' && !text.trim()) return;
    if (activeTab === 'photo' && !file) return;

    setLoading(true);
    setResult(null);
    setEmotionResult(null);
    setShowEmotion(false);

    try {
      const data: ReportResult =
        activeTab === 'text'
          ? await analyzeReport(text)
          : await analyzeReportOCR(file!);

      if (data.emotion_trigger === 'moderate' || data.emotion_trigger === 'severe') {
        try {
          const emotionData: EmotionResult = await assessEmotion(data.summary);
          setEmotionResult(emotionData);
          setShowEmotion(true);
        } catch {
          // If emotion assessment fails, still show results
        }
      }

      setResult(data);
    } catch (err) {
      console.error('Report analysis failed:', err);
      alert('解读失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setText('');
    setFile(null);
    setFilePreview(null);
    setEmotionResult(null);
    setShowEmotion(false);
  };

  const abnormalIndicators = result?.indicators?.filter((i) => i.status !== 'normal') ?? [];
  const normalIndicators = result?.indicators?.filter((i) => i.status === 'normal') ?? [];

  const familySummary = result?.summary
    ? result.summary.split(/[。！？]/).filter(Boolean).slice(0, 2).join('。') + '。'
    : '';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header stage="报告解读" />

      {showEmotion && emotionResult && (
        <EmotionModal emotion={emotionResult} onClose={() => setShowEmotion(false)} />
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20 page-enter">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingSpinner text="正在为您解读报告..." />
          </div>
        )}

        {!loading && !result && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-gray-900">报告解读</h1>
              <p className="text-sm text-gray-500">上传或粘贴您的检验报告，AI为您解读</p>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'text'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                粘贴文本
              </button>
              <button
                onClick={() => setActiveTab('photo')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'photo'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                拍照上传
              </button>
            </div>

            {activeTab === 'text' && (
              <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="请将检验报告文字粘贴到这里...&#10;&#10;支持各类血常规、肝功能、肾功能、血脂、血糖等检验报告"
                  className="w-full h-52 p-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setText(SAMPLE_REPORT)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    试试示例
                  </button>
                  <span className="text-xs text-gray-400">
                    {text.length > 0 ? `${text.length} 字` : ''}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                    dragOver
                      ? 'border-blue-600 bg-blue-50'
                      : filePreview
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {filePreview ? (
                    <div className="relative w-full h-full p-3">
                      <img
                        src={filePreview}
                        alt="预览"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setFilePreview(null);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                        <ImagePlus className="w-7 h-7 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">点击拍照或选择图片</p>
                      <p className="text-xs text-gray-400 mt-1">支持拖拽上传</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={
                (activeTab === 'text' && !text.trim()) ||
                (activeTab === 'photo' && !file)
              }
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                开始解读
              </span>
            </button>
          </div>
        )}

        {!loading && result && (
          <div className={`animate-[fadeIn_0.4s_ease-out] transition-all duration-300 ${familyMode ? 'space-y-5' : 'space-y-4'}`}>
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className={`text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700 transition-colors ${familyMode ? 'text-sm' : 'text-xs'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                重新解读
              </button>
            </div>

            <FamilyModeToggle familyMode={familyMode} onToggle={() => setFamilyMode(!familyMode)} />

            {familyMode && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                <p className="text-sm text-orange-700 font-medium">
                  当前为家属模式 -- 字体已放大，仅显示关键信息
                </p>
              </div>
            )}

            {/* Summary card */}
            {familyMode ? (
              <div className="rounded-xl bg-amber-500 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">AI 解读摘要</h2>
                </div>
                <p className="text-lg text-white/95 leading-[1.8]">{familySummary}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-gray-100 border-l-4 border-l-blue-600 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-2">AI 解读摘要</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {abnormalIndicators.length > 0 && (
              <div className={familyMode ? 'space-y-4' : 'space-y-2'}>
                <h3 className={`font-semibold text-gray-900 flex items-center gap-1.5 px-1 ${familyMode ? 'text-lg' : 'text-sm'}`}>
                  <AlertTriangle className={familyMode ? 'w-5 h-5 text-amber-500' : 'w-4 h-4 text-amber-500'} />
                  异常指标 ({abnormalIndicators.length})
                </h3>
                <div className={familyMode ? 'space-y-4' : 'space-y-3'}>
                  {abnormalIndicators.map((ind, i) =>
                    familyMode ? (
                      <IndicatorCardFamily key={`abnormal-${i}`} indicator={ind} />
                    ) : (
                      <IndicatorCard key={`abnormal-${i}`} indicator={ind} />
                    )
                  )}
                </div>
              </div>
            )}

            {!familyMode && normalIndicators.length > 0 && (
              <NormalIndicatorsCollapsible indicators={normalIndicators} />
            )}

            {(result.attention_items?.length ?? 0) > 0 && (
              <div className={familyMode ? 'space-y-3' : 'space-y-2'}>
                <h3 className={`font-semibold text-gray-900 flex items-center gap-1.5 px-1 ${familyMode ? 'text-lg' : 'text-sm'}`}>
                  <AlertTriangle className={familyMode ? 'w-5 h-5 text-amber-500' : 'w-4 h-4 text-amber-500'} />
                  注意事项
                </h3>
                <div className={familyMode ? 'space-y-3' : 'space-y-2'}>
                  {result.attention_items?.map((item, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 rounded-xl bg-amber-50 border border-amber-100 ${familyMode ? 'p-4' : 'p-3.5'}`}
                    >
                      <div className={`rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 ${familyMode ? 'w-6 h-6' : 'w-5 h-5'}`}>
                        <AlertTriangle className={familyMode ? 'w-4 h-4 text-amber-500' : 'w-3 h-3 text-amber-500'} />
                      </div>
                      <p className={`text-gray-900 leading-relaxed ${familyMode ? 'text-base leading-[1.8]' : 'text-xs'}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {familyMode && (
              <div className="space-y-3 mt-4">
                <div className="p-5 rounded-xl bg-orange-50 border border-orange-200 text-center">
                  <p className="text-lg font-bold text-orange-800 leading-[1.8]">
                    如有疑问，带着这个页面去找医生
                  </p>
                </div>
                <a
                  href="tel:10000"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-600 active:scale-[0.98] transition-all"
                >
                  <Phone className="w-6 h-6" />
                  打电话给子女
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <DisclaimerBar />
      <BottomNav />
    </div>
  );
}
