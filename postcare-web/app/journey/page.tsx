'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  FileText,
  Heart,
  Pill,
  CalendarDays,
  Utensils,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { fullJourney } from '@/lib/api';

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

const SAMPLE_DRUGS = ['奥美拉唑', '阿莫西林', '六味地黄丸'];

const PROGRESS_STEPS = [
  { label: '解读报告', icon: FileText },
  { label: '情绪评估', icon: Heart },
  { label: '用药分析', icon: Pill },
  { label: '复查提醒', icon: CalendarDays },
  { label: '生活建议', icon: Utensils },
];

interface JourneyResult {
  report?: { summary?: string; abnormal_indicators?: unknown[]; explanation?: string };
  emotion?: { level?: string; message?: string };
  medication?: { suggestions?: string[]; warnings?: string[] };
  followup?: { plan?: string[]; next_date?: string; reminders?: string[] };
  lifestyle?: { diet?: string; exercise?: string; sleep?: string; tips?: string[] };
  profile?: { one_page_summary?: string };
}

// --- Drug tag input (reused pattern from medication page) ---
function DrugTagInput({
  drugs,
  onAdd,
  onRemove,
}: {
  drugs: string[];
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 min-h-[44px] p-2.5 rounded-xl border border-border bg-white cursor-text focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {drugs.map((drug, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light text-primary text-sm font-medium"
        >
          {drug}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(i);
            }}
            className="ml-0.5 hover:bg-primary/10 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={drugs.length === 0 ? '输入药品名称，按回车添加（可选）' : '继续添加...'}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-text placeholder:text-text-secondary/60"
      />
    </div>
  );
}

// --- Stage Card ---
function StageCard({
  icon: Icon,
  title,
  gradient,
  visible,
  children,
}: {
  icon: React.ElementType;
  title: string;
  gradient: string;
  visible: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`transform transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="rounded-[18px] bg-white border border-border/80 shadow-[var(--shadow-soft)] overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-4 text-left"
        >
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text">{title}</h3>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
          )}
        </button>

        {/* Summary line always visible */}
        <div className="px-4 pb-3 -mt-1">{children}</div>

        {/* Expanded detail */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 border-t border-border pt-3" id={`stage-detail-${title}`} />
        </div>
      </div>
    </div>
  );
}

// --- Progress Bar ---
function ProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      {PROGRESS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i < activeStep;
        const isCurrent = i === activeStep;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="relative flex items-center w-full">
              {i > 0 && (
                <div
                  className={`absolute right-1/2 h-0.5 w-full transition-colors duration-500 ${
                    isActive ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
              <div
                className={`relative z-10 mx-auto w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : isCurrent
                      ? 'bg-primary/20 text-primary ring-2 ring-primary/30 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <span
              className={`text-[10px] font-medium transition-colors duration-300 ${
                isActive ? 'text-primary' : isCurrent ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page ---
export default function JourneyPage() {
  const [reportText, setReportText] = useState('');
  const [drugs, setDrugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JourneyResult | null>(null);
  const [error, setError] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [visibleStages, setVisibleStages] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const addDrug = (name: string) => {
    if (!drugs.includes(name)) setDrugs([...drugs, name]);
  };
  const removeDrug = (index: number) => setDrugs(drugs.filter((_, i) => i !== index));

  const fillExample = () => {
    setReportText(SAMPLE_REPORT);
    setDrugs(SAMPLE_DRUGS);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!reportText.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setVisibleStages(0);
    setProgressStep(0);

    // Start progress animation
    let step = 0;
    progressInterval.current = setInterval(() => {
      step++;
      if (step <= 5) {
        setProgressStep(step);
      }
    }, 1000);

    try {
      const userNote = drugs.length > 0 ? `当前服用药物: ${drugs.join(', ')}` : undefined;
      const data = await fullJourney(reportText, userNote);
      setResult(data);
      setProgressStep(5);
    } catch {
      setError('分析失败，请稍后重试');
    } finally {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setLoading(false);
    }
  };

  // Cascade reveal stages after result arrives
  useEffect(() => {
    if (!result) return;
    const stages = getStageList(result);
    stages.forEach((_, i) => {
      setTimeout(() => setVisibleStages(i + 1), i * 600);
    });
  }, [result]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const handleReset = () => {
    setResult(null);
    setVisibleStages(0);
    setProgressStep(0);
    setError('');
  };

  const stages = result ? getStageList(result) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header stage="全旅程" />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-28 page-enter">
        {/* Input Section */}
        {!loading && !result && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-indigo-600 p-5 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-6 h-6" />
                  <h1 className="text-lg font-bold">一键全旅程分析</h1>
                </div>
                <p className="text-sm text-blue-100 leading-relaxed">
                  上传一份报告，PostCare 自动完成报告解读、情绪关怀、用药指导、复查提醒和生活建议
                </p>
              </div>
            </div>

            {/* Report text */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">检查报告</label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="请将检验报告文字粘贴到这里..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text text-sm leading-relaxed placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
              />
            </div>

            {/* Drugs input */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                当前用药（可选）
              </label>
              <DrugTagInput drugs={drugs} onAdd={addDrug} onRemove={removeDrug} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={fillExample}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                试试示例
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reportText.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-500 text-white font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                <Activity className="w-5 h-5" />
                一键全旅程分析
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <LoadingSpinner text="PostCare 正在为您走完全旅程..." />
            <ProgressBar activeStep={progressStep} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-light text-danger text-sm mt-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={handleReset} className="ml-auto text-xs underline">
              重试
            </button>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">
            <button
              onClick={handleReset}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              重新分析
            </button>

            {stages.map((stage, i) => (
              <StageCard
                key={stage.key}
                icon={stage.icon}
                title={stage.title}
                gradient={stage.gradient}
                visible={visibleStages > i}
              >
                {stage.summary}
              </StageCard>
            ))}

            {/* Completion card */}
            <div
              className={`transform transition-all duration-500 ease-out ${
                visibleStages > stages.length
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-8 opacity-0 pointer-events-none'
              }`}
            >
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white text-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-90" />
                <h3 className="text-lg font-bold mb-1">全旅程分析完成</h3>
                <p className="text-sm text-emerald-50 leading-relaxed">
                  {result.profile?.one_page_summary
                    ? result.profile.one_page_summary.slice(0, 120) + (result.profile.one_page_summary.length > 120 ? '...' : '')
                    : '以上内容仅供参考，具体诊疗请遵医嘱'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <DisclaimerBar />
      <BottomNav />

      {/* Keyframes are in globals.css */}
    </div>
  );
}

// --- Helper to build stage list from result ---
function getStageList(result: JourneyResult) {
  const stages: {
    key: string;
    icon: React.ElementType;
    title: string;
    gradient: string;
    summary: React.ReactNode;
  }[] = [];

  // 1. Report
  if (result.report) {
    const abnormalCount = result.report.abnormal_indicators?.length ?? 0;
    stages.push({
      key: 'report',
      icon: FileText,
      title: '报告解读',
      gradient: 'from-blue-500 to-indigo-500',
      summary: (
        <div className="space-y-1.5">
          <p className="text-sm text-text leading-relaxed">
            {result.report.summary || '暂无摘要'}
          </p>
          {abnormalCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-warning font-medium">
              <AlertTriangle className="w-3 h-3" />
              {abnormalCount} 项异常指标
            </span>
          )}
          {result.report.explanation && (
            <p className="text-xs text-text-secondary leading-relaxed mt-1">
              {result.report.explanation}
            </p>
          )}
        </div>
      ),
    });
  }

  // 2. Emotion
  if (result.emotion?.message) {
    stages.push({
      key: 'emotion',
      icon: Heart,
      title: '情绪关怀',
      gradient: 'from-pink-500 to-rose-500',
      summary: (
        <p className="text-sm text-text leading-relaxed">
          {result.emotion.message.slice(0, 150)}
          {result.emotion.message.length > 150 ? '...' : ''}
        </p>
      ),
    });
  }

  // 3. Medication
  if (result.medication) {
    const sugCount = result.medication.suggestions?.length ?? 0;
    const hasWarnings = (result.medication.warnings?.length ?? 0) > 0;
    stages.push({
      key: 'medication',
      icon: Pill,
      title: '用药指导',
      gradient: 'from-emerald-500 to-green-500',
      summary: (
        <div className="space-y-1.5">
          {sugCount > 0 && (
            <p className="text-sm text-text leading-relaxed">
              {result.medication.suggestions![0]}
            </p>
          )}
          {result.medication.suggestions?.slice(1).map((s, i) => (
            <p key={i} className="text-xs text-text-secondary leading-relaxed">
              {s}
            </p>
          ))}
          {hasWarnings && (
            <div className="mt-1">
              <span className="text-xs text-warning font-medium">注意事项：</span>
              {result.medication.warnings?.map((w, i) => (
                <p key={i} className="text-xs text-text-secondary leading-relaxed">
                  {w}
                </p>
              ))}
            </div>
          )}
          {sugCount === 0 && !hasWarnings && (
            <p className="text-sm text-text-secondary">暂无用药建议</p>
          )}
        </div>
      ),
    });
  }

  // 4. Followup
  if (result.followup) {
    stages.push({
      key: 'followup',
      icon: CalendarDays,
      title: '复查提醒',
      gradient: 'from-amber-500 to-orange-500',
      summary: (
        <div className="space-y-1.5">
          {result.followup.next_date && (
            <p className="text-sm font-semibold text-text">
              建议复查日期：{result.followup.next_date}
            </p>
          )}
          {result.followup.plan?.map((p, i) => (
            <p key={i} className="text-xs text-text-secondary leading-relaxed">
              {p}
            </p>
          ))}
          {result.followup.reminders?.map((r, i) => (
            <p key={i} className="text-xs text-warning leading-relaxed">
              {r}
            </p>
          ))}
        </div>
      ),
    });
  }

  // 5. Lifestyle
  if (result.lifestyle) {
    stages.push({
      key: 'lifestyle',
      icon: Utensils,
      title: '生活建议',
      gradient: 'from-purple-500 to-violet-500',
      summary: (
        <div className="space-y-1">
          {result.lifestyle.diet && (
            <p className="text-xs text-text leading-relaxed">
              <span className="font-medium">饮食：</span>
              {result.lifestyle.diet}
            </p>
          )}
          {result.lifestyle.exercise && (
            <p className="text-xs text-text leading-relaxed">
              <span className="font-medium">运动：</span>
              {result.lifestyle.exercise}
            </p>
          )}
          {result.lifestyle.sleep && (
            <p className="text-xs text-text leading-relaxed">
              <span className="font-medium">作息：</span>
              {result.lifestyle.sleep}
            </p>
          )}
          {result.lifestyle.tips?.map((t, i) => (
            <p key={i} className="text-xs text-text-secondary leading-relaxed">
              {t}
            </p>
          ))}
        </div>
      ),
    });
  }

  return stages;
}
