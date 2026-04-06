'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  ChevronRight,
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

const RECOVERY_PLAN = [
  { week: '第1周', text: '适应用药，注意观察副作用' },
  { week: '第2周', text: '开始调整饮食和运动习惯' },
  { week: '第3周', text: '预约复查，准备复诊问题' },
  { week: '第4周', text: '复查日！对比上次结果' },
];

interface JourneyResult {
  report?: { summary?: string; abnormal_indicators?: unknown[]; explanation?: string };
  emotion?: { level?: string; message?: string };
  medication?: { suggestions?: string[]; warnings?: string[] };
  followup?: { plan?: string[]; next_date?: string; reminders?: string[] };
  lifestyle?: { diet?: string; exercise?: string; sleep?: string; tips?: string[] };
  profile?: { one_page_summary?: string };
}

// --- Drug tag input ---
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
      className="flex flex-wrap gap-2 min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-white/5 cursor-text focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {drugs.map((drug, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
          {drug}
          <button onClick={(e) => { e.stopPropagation(); onRemove(i); }} className="ml-0.5 hover:bg-blue-500/30 rounded-full p-0.5 transition-colors">
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
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
      />
    </div>
  );
}

// --- Stage Card ---
function StageCard({
  icon: Icon,
  title,
  color,
  visible,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  visible: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  // Map old colors to left-bar tint colors
  const barColorMap: Record<string, string> = {
    'bg-blue-600': 'bg-blue-500',
    'bg-blue-500': 'bg-blue-400',
    'bg-green-600': 'bg-emerald-500',
    'bg-amber-500': 'bg-amber-400',
    'bg-purple-600': 'bg-purple-400',
  };
  const barColor = barColorMap[color] || 'bg-blue-500';

  return (
    <div className={`transition-all duration-500 ease-out ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="rounded-xl bg-[#141E33] border border-white/5 overflow-hidden flex">
        {/* Left colored bar */}
        <div className={`w-1 flex-shrink-0 ${barColor}`} />
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-100">{title}</h3>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
          </button>
          <div className="px-4 pb-3 -mt-1">{children}</div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-4 pb-4 border-t border-white/5 pt-3" id={`stage-detail-${title}`} />
          </div>
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
                <div className={`absolute right-1/2 h-0.5 w-full transition-colors duration-500 ${isActive ? 'bg-blue-500' : 'bg-white/5'}`} />
              )}
              <div className={`relative z-10 mx-auto w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-500 text-white' : isCurrent ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/30' : 'bg-white/5 text-slate-500'}`}>
                {isActive ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
            </div>
            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive || isCurrent ? 'text-blue-400' : 'text-slate-500'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- Story Line ---
function StoryLine({ storyIndex, storyLines }: { storyIndex: number; storyLines: { text: string }[] }) {
  return (
    <div className="text-center py-6">
      <div className="min-h-[56px] flex items-center justify-center">
        <p key={storyIndex} className="text-xl font-bold text-slate-100 animate-[fadeIn_0.5s_ease-out]">
          {storyLines[storyIndex]?.text}
        </p>
      </div>
      <div className="mt-4 mx-auto w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((storyIndex + 1) / storyLines.length) * 100}%` }}
        />
      </div>
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
  const [storyIndex, setStoryIndex] = useState(0);
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
    setStoryIndex(0);

    let step = 0;
    progressInterval.current = setInterval(() => {
      step++;
      if (step <= 5) setProgressStep(step);
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

  // Build dynamic story lines based on result
  const abnormalCount = result?.report?.abnormal_indicators?.length ?? 0;
  const storyLines = [
    { text: '正在解读您的报告...', delay: 0 },
    { text: abnormalCount > 0 ? `发现了${abnormalCount}项需要关注的指标` : '您的各项指标总体良好', delay: 2500 },
    { text: '别担心，让我帮您理清头绪', delay: 5000 },
    { text: '以下是您的专属健康方案', delay: 7500 },
  ];

  // Story line progression + stage cascade
  useEffect(() => {
    if (!result) return;

    // Story line timers
    const storyTimers = storyLines.map((line, i) =>
      setTimeout(() => setStoryIndex(i), line.delay)
    );

    // Stage cascade (starts after 2nd story line)
    const stages = getStageList(result);
    const stageTimers = stages.map((_, i) =>
      setTimeout(() => setVisibleStages(i + 1), 3000 + i * 800)
    );

    // Show completion card
    const completionTimer = setTimeout(
      () => setVisibleStages(stages.length + 1),
      3000 + stages.length * 800
    );

    return () => {
      storyTimers.forEach(clearTimeout);
      stageTimers.forEach(clearTimeout);
      clearTimeout(completionTimer);
    };
  }, [result]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const handleReset = () => {
    setResult(null);
    setVisibleStages(0);
    setProgressStep(0);
    setStoryIndex(0);
    setError('');
  };

  const stages = result ? getStageList(result) : [];

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Header stage="全旅程" />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-20 page-enter">
        {/* Input */}
        {!loading && !result && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="rounded-xl bg-[#141E33] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.08)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-6 h-6 text-blue-400" />
                <h1 className="text-lg font-bold text-slate-100">一键全旅程分析</h1>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                上传一份报告，PostCare 自动完成报告解读、情绪关怀、用药指导、复查提醒和生活建议
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-100 mb-2">检查报告</label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="请将检验报告文字粘贴到这里..."
                rows={8}
                className="input-dark w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-sm leading-relaxed placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">当前用药（可选）</label>
              <DrugTagInput drugs={drugs} onAdd={addDrug} onRemove={removeDrug} />
            </div>

            <div className="flex gap-3">
              <button onClick={fillExample} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-colors">
                <Sparkles className="w-4 h-4" />
                试试示例
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reportText.trim()}
                className="btn-glow flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Activity className="w-5 h-5" />
                一键全旅程分析
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <LoadingSpinner text="PostCare 正在为您走完全旅程..." />
            <ProgressBar activeStep={progressStep} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={handleReset} className="ml-auto text-xs underline">重试</button>
          </div>
        )}

        {/* Results with Story Line */}
        {result && !loading && (
          <div className="space-y-4">
            <button onClick={handleReset} className="text-xs text-blue-400 font-medium flex items-center gap-1 hover:text-blue-300 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              重新分析
            </button>

            {/* Story line */}
            <StoryLine storyIndex={storyIndex} storyLines={storyLines} />

            {/* Stage cards */}
            {stages.map((stage, i) => (
              <StageCard key={stage.key} icon={stage.icon} title={stage.title} color={stage.color} visible={visibleStages > i}>
                {stage.summary}
              </StageCard>
            ))}

            {/* 28-Day Recovery Plan */}
            <div className={`transition-all duration-500 ease-out ${visibleStages > stages.length ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="rounded-xl bg-[#141E33] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.08)] p-5">
                <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  28天康复计划
                </h3>
                <div className="space-y-3">
                  {RECOVERY_PLAN.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-14 text-xs font-bold font-data text-blue-400 pt-0.5">{item.week}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-sm text-slate-400">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/timeline"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                >
                  查看完整28天计划
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Completion */}
            <div className={`transition-all duration-500 ease-out ${visibleStages > stages.length ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400 opacity-90" />
                <h3 className="text-lg font-bold text-green-400 mb-1">全旅程分析完成</h3>
                <p className="text-sm text-green-400/70 leading-relaxed">
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
    </div>
  );
}

// --- Helper to build stage list from result ---
function getStageList(result: JourneyResult) {
  const stages: {
    key: string;
    icon: React.ElementType;
    title: string;
    color: string;
    summary: React.ReactNode;
  }[] = [];

  if (result.report) {
    const abnormalCount = result.report.abnormal_indicators?.length ?? 0;
    stages.push({
      key: 'report',
      icon: FileText,
      title: '报告解读',
      color: 'bg-blue-600',
      summary: (
        <div className="space-y-1.5">
          <p className="text-sm text-slate-100 leading-relaxed">{result.report.summary || '暂无摘要'}</p>
          {abnormalCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-data">{abnormalCount}</span> 项异常指标
            </span>
          )}
          {result.report.explanation && (
            <p className="text-xs text-slate-400 leading-relaxed mt-1">{result.report.explanation}</p>
          )}
        </div>
      ),
    });
  }

  if (result.emotion?.message) {
    stages.push({
      key: 'emotion',
      icon: Heart,
      title: '情绪关怀',
      color: 'bg-blue-500',
      summary: (
        <p className="text-sm text-slate-100 leading-relaxed">
          {result.emotion.message.slice(0, 150)}{result.emotion.message.length > 150 ? '...' : ''}
        </p>
      ),
    });
  }

  if (result.medication) {
    const sugCount = result.medication.suggestions?.length ?? 0;
    const hasWarnings = (result.medication.warnings?.length ?? 0) > 0;
    stages.push({
      key: 'medication',
      icon: Pill,
      title: '用药指导',
      color: 'bg-green-600',
      summary: (
        <div className="space-y-1.5">
          {sugCount > 0 && <p className="text-sm text-slate-100 leading-relaxed">{result.medication.suggestions![0]}</p>}
          {result.medication.suggestions?.slice(1).map((s, i) => (
            <p key={i} className="text-xs text-slate-400 leading-relaxed">{s}</p>
          ))}
          {hasWarnings && (
            <div className="mt-1">
              <span className="text-xs text-amber-400 font-medium">注意事项：</span>
              {result.medication.warnings?.map((w, i) => (
                <p key={i} className="text-xs text-slate-400 leading-relaxed">{w}</p>
              ))}
            </div>
          )}
          {sugCount === 0 && !hasWarnings && <p className="text-sm text-slate-400">暂无用药建议</p>}
        </div>
      ),
    });
  }

  if (result.followup) {
    stages.push({
      key: 'followup',
      icon: CalendarDays,
      title: '复查提醒',
      color: 'bg-amber-500',
      summary: (
        <div className="space-y-1.5">
          {result.followup.next_date && <p className="text-sm font-semibold text-slate-100">建议复查日期：<span className="font-data">{result.followup.next_date}</span></p>}
          {result.followup.plan?.map((p, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{p}</p>)}
          {result.followup.reminders?.map((r, i) => <p key={i} className="text-xs text-amber-400 leading-relaxed">{r}</p>)}
        </div>
      ),
    });
  }

  if (result.lifestyle) {
    stages.push({
      key: 'lifestyle',
      icon: Utensils,
      title: '生活建议',
      color: 'bg-purple-600',
      summary: (
        <div className="space-y-1">
          {result.lifestyle.diet && <p className="text-xs text-slate-100 leading-relaxed"><span className="font-medium text-slate-300">饮食：</span>{result.lifestyle.diet}</p>}
          {result.lifestyle.exercise && <p className="text-xs text-slate-100 leading-relaxed"><span className="font-medium text-slate-300">运动：</span>{result.lifestyle.exercise}</p>}
          {result.lifestyle.sleep && <p className="text-xs text-slate-100 leading-relaxed"><span className="font-medium text-slate-300">作息：</span>{result.lifestyle.sleep}</p>}
          {result.lifestyle.tips?.map((t, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{t}</p>)}
        </div>
      ),
    });
  }

  return stages;
}
