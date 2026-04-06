'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  Stethoscope,
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

// ==================== Health Score Logic ====================

function calculateHealthScore(indicators: Indicator[]): number {
  if (!indicators || indicators.length === 0) return 100;
  const total = indicators.length;
  const normal = indicators.filter(i => i.status === 'normal').length;
  const high = indicators.filter(i => i.status === 'high' || i.status === 'mild' || i.status === 'low').length;
  const critical = indicators.filter(i => i.status === 'critical').length;
  let score = 100;
  score -= high * 8;
  score -= critical * 15;
  const normalRatio = normal / total;
  score = Math.max(30, Math.min(100, Math.round(score * (0.5 + normalRatio * 0.5))));
  return score;
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-[#059669]';
  if (score >= 70) return 'text-[#2563EB]';
  if (score >= 55) return 'text-[#D97706]';
  return 'text-[#DC2626]';
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '整体良好';
  if (score >= 70) return '基本正常';
  if (score >= 55) return '需要关注';
  return '建议就医';
}

function getScoreRingColor(score: number): string {
  if (score >= 85) return '#059669';
  if (score >= 70) return '#2563EB';
  if (score >= 55) return '#D97706';
  return '#DC2626';
}

function getDimensions(indicators: Indicator[]) {
  if (!indicators || indicators.length === 0) return [];
  const groups: Record<string, Indicator[]> = {};
  indicators.forEach(ind => {
    const name = ind.name;
    if (['WBC', 'RBC', 'HGB', 'PLT', '白细胞', '红细胞', '血红蛋白', '血小板'].some(k => name.includes(k))) {
      (groups['血常规'] = groups['血常规'] || []).push(ind);
    } else if (['ALT', 'AST', 'GGT', 'TBIL', 'ALB', '转氨酶', '胆红素', '白蛋白'].some(k => name.includes(k))) {
      (groups['肝功能'] = groups['肝功能'] || []).push(ind);
    } else if (['TC', 'TG', 'LDL', 'HDL', '胆固醇', '甘油三酯'].some(k => name.includes(k))) {
      (groups['血脂'] = groups['血脂'] || []).push(ind);
    } else if (['GLU', 'HbA1c', '血糖', '糖化'].some(k => name.includes(k))) {
      (groups['血糖'] = groups['血糖'] || []).push(ind);
    } else if (['CREA', 'BUN', 'UA', '肌酐', '尿素', '尿酸'].some(k => name.includes(k))) {
      (groups['肾功能'] = groups['肾功能'] || []).push(ind);
    } else {
      (groups['其他'] = groups['其他'] || []).push(ind);
    }
  });

  return Object.entries(groups).map(([name, inds]) => {
    const hasCritical = inds.some(i => i.status === 'critical');
    const hasAbnormal = inds.some(i => i.status !== 'normal');
    return {
      name,
      status: hasCritical ? 'bad' as const : hasAbnormal ? 'warning' as const : 'good' as const,
    };
  });
}

// ==================== Health Score View ====================

function HealthScoreView({
  indicators,
  displayScore,
  onViewDetails,
}: {
  indicators: Indicator[];
  displayScore: number;
  onViewDetails: () => void;
}) {
  const targetScore = calculateHealthScore(indicators);
  const dimensions = getDimensions(indicators);
  const ringColor = getScoreRingColor(targetScore);
  const circumference = 2 * Math.PI * 52;
  const progress = displayScore / 100;

  return (
    <div className="flex flex-col items-center py-8 animate-[fadeIn_0.3s_ease-out]">
      <p className="text-sm text-[#6B7280] mb-6">健康评分</p>

      {/* Score ring */}
      <div className="relative w-44 h-44 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth={8} />
          {/* Progress ring */}
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data text-5xl font-bold tabular-nums text-[#1E3A5F]">
            {displayScore}
          </span>
        </div>
      </div>

      <p className={`text-lg font-semibold mb-6 ${getScoreColor(targetScore)}`}>
        {getScoreLabel(targetScore)}
      </p>

      {/* Dimension tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
        {dimensions.map((dim) => {
          const style = dim.status === 'good'
            ? 'bg-[#ECFDF5] text-[#059669]'
            : dim.status === 'warning'
              ? 'bg-[#FFFBEB] text-[#D97706]'
              : 'bg-[#FEF2F2] text-[#DC2626]';
          const icon = dim.status === 'good' ? '✓' : dim.status === 'warning' ? '⚠' : '✗';
          return (
            <span key={dim.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${style}`}>
              <span>{icon}</span>
              {dim.name}
            </span>
          );
        })}
      </div>

      <button
        onClick={onViewDetails}
        className="text-sm text-[#2563EB] font-medium flex items-center gap-1 hover:text-[#1d4ed8] transition-colors"
      >
        查看详细解读 ↓
      </button>
    </div>
  );
}

// ==================== Doctor View ====================

function DoctorView({ indicators, summary }: { indicators: Indicator[]; summary: string }) {
  const safeIndicators = indicators ?? [];
  const abnormal = safeIndicators.filter(i => i.status !== 'normal');
  const normal = safeIndicators.filter(i => i.status === 'normal');

  return (
    <div className="bg-[#F9FAFB] rounded-xl border border-black/[0.06] overflow-hidden font-data text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-[#F3F4F6]">
        <span className="font-bold text-[#1A1A1A] font-sans">检验报告AI辅助分析</span>
        <span className="text-xs text-[#9CA3AF] font-sans">PostCare</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Abnormal table */}
        {abnormal.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#6B7280] mb-2 font-sans">异常指标汇总</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-[#F3F4F6]">
                    <th className="text-left py-1.5 pr-3 text-[#6B7280] font-semibold">指标</th>
                    <th className="text-right py-1.5 px-3 text-[#6B7280] font-semibold">结果</th>
                    <th className="text-right py-1.5 px-3 text-[#6B7280] font-semibold">参考范围</th>
                    <th className="text-left py-1.5 px-3 text-[#6B7280] font-semibold">单位</th>
                    <th className="text-right py-1.5 pl-3 text-[#6B7280] font-semibold">标记</th>
                  </tr>
                </thead>
                <tbody>
                  {abnormal.map((ind, i) => {
                    const refRange = ind.reference_low != null && ind.reference_high != null
                      ? `${ind.reference_low}-${ind.reference_high}`
                      : '-';
                    const flag = ind.status === 'critical' ? '↑↑H' : ind.direction === 'low' ? '↓L' : '↑H';
                    return (
                      <tr key={i} className="border-b border-black/[0.06]">
                        <td className="py-1.5 pr-3 text-[#1A1A1A] font-medium">{ind.name}</td>
                        <td className="py-1.5 px-3 text-right text-[#DC2626] font-semibold">{ind.value}</td>
                        <td className="py-1.5 px-3 text-right text-[#6B7280]">{refRange}</td>
                        <td className="py-1.5 px-3 text-[#6B7280]">{ind.unit}</td>
                        <td className="py-1.5 pl-3 text-right text-[#DC2626] font-semibold">{flag}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Normal table (collapsed) */}
        {normal.length > 0 && (
          <div>
            <p className="text-xs text-[#9CA3AF] font-sans">正常指标 ({normal.length}项): {normal.map(n => n.name).join('、')}</p>
          </div>
        )}

        {/* Clinical notes */}
        <div>
          <p className="text-xs font-bold text-[#6B7280] mb-2 font-sans">临床提示</p>
          <div className="space-y-1">
            {abnormal.map((ind, i) => {
              const direction = ind.direction === 'low' ? '↓' : '↑';
              return (
                <p key={i} className="text-xs text-[#374151] leading-relaxed">
                  {i + 1}. {ind.name}{direction} {ind.value}{ind.unit}
                  {ind.suggestion ? `，${ind.suggestion}` : ''}
                </p>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-black/[0.06]">
          <p className="text-[11px] text-[#9CA3AF] font-sans">AI辅助分析，仅供临床参考</p>
        </div>
      </div>
    </div>
  );
}

// ==================== View Mode Toggle ====================

function ViewModeToggle({
  mode,
  onToggle,
}: {
  mode: 'patient' | 'doctor';
  onToggle: () => void;
}) {
  return (
    <div className="flex bg-[#F5F5F0] rounded-full p-1">
      <button
        onClick={() => mode !== 'patient' && onToggle()}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
          mode === 'patient' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#374151]'
        }`}
      >
        <User className="w-4 h-4" />
        患者视角
      </button>
      <button
        onClick={() => mode !== 'doctor' && onToggle()}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
          mode === 'doctor' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#374151]'
        }`}
      >
        <Stethoscope className="w-4 h-4" />
        医生视角
      </button>
    </div>
  );
}

// ==================== Existing Components ====================

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
  const dotColor = isNormal ? '#059669' : status === 'critical' ? '#DC2626' : '#D97706';

  return (
    <div className="mt-2 mb-1">
      <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1 font-data">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-[#F3F4F6]">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${rangeLeft}%`,
            width: `${rangeRight - rangeLeft}%`,
            background: isNormal ? 'rgba(5,150,105,0.08)' : 'rgba(0,0,0,0.02)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-500"
          style={{ left: `${dotPosition}%`, backgroundColor: dotColor }}
        />
      </div>
      <div
        className="text-[10px] mt-0.5 transition-all duration-500 font-data"
        style={{ marginLeft: `${Math.max(5, Math.min(85, dotPosition - 5))}%`, color: dotColor }}
      >
        {value} {indicator.unit}
      </div>
    </div>
  );
}

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const isNormal = indicator.status === 'normal';
  const [expanded, setExpanded] = useState(!isNormal);
  const borderColor =
    indicator.status === 'critical' ? 'border-l-[#DC2626]'
      : indicator.status === 'normal' ? 'border-l-[#059669]'
        : 'border-l-[#D97706]';
  const valueColor =
    indicator.status === 'critical' ? '#DC2626'
      : indicator.status === 'normal' ? '#059669'
        : '#D97706';

  return (
    <div
      className={`relative bg-white rounded-2xl border-l-4 ${borderColor} overflow-hidden transition-all duration-300`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
    >
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-[#1A1A1A] text-sm truncate">{indicator.name}</span>
          <SeverityBadge severity={indicator.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular-nums font-bold font-data text-2xl" style={{ color: valueColor }}>{indicator.value}</span>
          <span className="text-xs text-[#9CA3AF]">{indicator.unit}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-4 space-y-3">
          <IndicatorBar indicator={indicator} />
          {indicator.explanation && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-100">
              <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="text-xs text-[#374151] leading-relaxed">{indicator.explanation}</p>
            </div>
          )}
          {indicator.suggestion && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-[#F5F5F0] border border-black/[0.04]">
              <Heart className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="text-xs text-[#374151] leading-relaxed">{indicator.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmotionModal({ emotion, onClose }: { emotion: EmotionResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 animate-[fadeIn_0.3s_ease-out]">
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)' }}
      >
        {/* Blue top bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #2563EB, #3B82F6, #60A5FA)' }} />
        <div className="bg-[#EFF6FF] p-6 pb-8">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#6B7280] hover:bg-black/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="text-3xl mb-3">🤗</div>
          <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">PostCare 关心您的感受</h3>
          <p className="text-sm text-[#374151] leading-relaxed">{emotion.comfort_message}</p>
        </div>
        <div className="p-5 space-y-3">
          {emotion.action_items?.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#2563EB]">{i + 1}</span>
              </div>
              <p className="text-sm text-[#1A1A1A] leading-relaxed">{s}</p>
            </div>
          ))}
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-xl bg-[#2563EB] text-white font-medium text-sm hover:bg-[#1d4ed8] active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}
          >
            我了解了，查看详细解读 →
          </button>
        </div>
      </div>
    </div>
  );
}

function NormalIndicatorsCollapsible({ indicators }: { indicators: Indicator[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#FAFAF8] transition-colors">
        <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-[#ECFDF5] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
          </span>
          正常指标 ({indicators.length})
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-3">
          {indicators.map((ind, i) => <IndicatorCard key={`normal-${i}`} indicator={ind} />)}
        </div>
      </div>
    </div>
  );
}

function IndicatorCardFamily({ indicator }: { indicator: Indicator }) {
  const [expanded, setExpanded] = useState(true);
  const borderColor = indicator.status === 'critical' ? '#DC2626' : '#D97706';

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-300"
      style={{ borderLeft: `5px solid ${borderColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
    >
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-bold text-[#1A1A1A] text-lg">{indicator.name}</span>
          <SeverityBadge severity={indicator.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular-nums font-extrabold text-2xl font-data" style={{ color: borderColor }}>{indicator.value}</span>
          <span className="text-sm text-[#9CA3AF]">{indicator.unit}</span>
          {expanded ? <ChevronUp className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />}
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 space-y-4">
          <IndicatorBar indicator={indicator} />
          {indicator.explanation && (
            <div className="flex gap-3 p-4 rounded-xl bg-[#FFFBEB] border border-amber-200">
              <Sparkles className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <p className="text-base text-[#374151] leading-[1.8]">{indicator.explanation}</p>
            </div>
          )}
          {indicator.suggestion && (
            <div className="flex gap-3 p-4 rounded-xl bg-[#FFF7ED] border border-amber-100">
              <Heart className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <p className="text-base text-[#374151] leading-[1.8]">{indicator.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FamilyModeToggle({ familyMode, onToggle }: { familyMode: boolean; onToggle: () => void }) {
  return (
    <div className="flex bg-[#F5F5F0] rounded-full p-1 mb-4">
      <button
        onClick={() => !familyMode || onToggle()}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${!familyMode ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#374151]'}`}
      >
        <User className="w-4 h-4" />
        标准模式
      </button>
      <button
        onClick={() => familyMode || onToggle()}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${familyMode ? 'bg-white shadow-sm text-[#D97706]' : 'text-[#6B7280] hover:text-[#374151]'}`}
      >
        <Users className="w-4 h-4" />
        家属模式
      </button>
    </div>
  );
}

// ==================== Main Page ====================

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
  const [viewMode, setViewMode] = useState<'patient' | 'doctor'>('patient');
  const [showScore, setShowScore] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Score animation + auto-dismiss
  useEffect(() => {
    if (!result) return;
    setShowScore(true);
    setDisplayScore(0);
    const target = calculateHealthScore(result.indicators ?? []);
    const duration = 1500;
    const start = Date.now();
    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    const timer = setTimeout(() => setShowScore(false), 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [result]);

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
    setViewMode('patient');
    try {
      const data: ReportResult =
        activeTab === 'text' ? await analyzeReport(text) : await analyzeReportOCR(file!);
      if (data.emotion_trigger === 'moderate' || data.emotion_trigger === 'severe') {
        try {
          const emotionData: EmotionResult = await assessEmotion(data.summary);
          setEmotionResult(emotionData);
          setShowEmotion(true);
        } catch { /* still show results */ }
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
    setShowScore(false);
    setViewMode('patient');
  };

  const abnormalIndicators = result?.indicators?.filter((i) => i.status !== 'normal') ?? [];
  const normalIndicators = result?.indicators?.filter((i) => i.status === 'normal') ?? [];
  const familySummary = result?.summary
    ? result.summary.split(/[。！？]/).filter(Boolean).slice(0, 2).join('。') + '。'
    : '';

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header stage="报告解读" />

      {showEmotion && emotionResult && (
        <EmotionModal emotion={emotionResult} onClose={() => setShowEmotion(false)} />
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20 page-enter">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingSpinner text="正在为您解读报告..." />
          </div>
        )}

        {/* Input form */}
        {!loading && !result && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-[#1A1A1A]">报告解读</h1>
              <p className="text-sm text-[#6B7280]">上传或粘贴您的检验报告，AI为您解读</p>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-[#F5F5F0] rounded-full p-1">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === 'text' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#374151]'}`}
              >
                <ClipboardPaste className="w-4 h-4" />
                粘贴文本
              </button>
              <button
                onClick={() => setActiveTab('photo')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === 'photo' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#374151]'}`}
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
                  className="w-full h-52 p-4 rounded-xl text-sm resize-none bg-[#F5F5F0] border border-[#E5E5E0] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[rgba(37,99,235,0.1)] transition-all"
                />
                <div className="flex items-center justify-between">
                  <button onClick={() => setText(SAMPLE_REPORT)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2563EB] text-xs font-medium hover:bg-[#EFF6FF] active:scale-95 transition-all border border-[#2563EB]/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    试试示例
                  </button>
                  <span className="text-xs text-[#9CA3AF]">{text.length > 0 ? `${text.length} 字` : ''}</span>
                </div>
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragOver ? 'border-[#2563EB] bg-[#EFF6FF]' : filePreview ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#E5E5E0] bg-white hover:border-[#2563EB] hover:bg-[#EFF6FF]'}`}
                >
                  {filePreview ? (
                    <div className="relative w-full h-full p-3">
                      <img src={filePreview} alt="预览" className="w-full h-full object-contain rounded-lg" />
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview(null); }} className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-3">
                        <ImagePlus className="w-7 h-7 text-[#2563EB]" />
                      </div>
                      <p className="text-sm font-medium text-[#1A1A1A]">点击拍照或选择图片</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">支持拖拽上传</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={(activeTab === 'text' && !text.trim()) || (activeTab === 'photo' && !file)}
              className="w-full py-3.5 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              style={{ boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                开始解读
              </span>
            </button>
          </div>
        )}

        {/* Health Score View */}
        {!loading && result && showScore && (
          <HealthScoreView
            indicators={result.indicators ?? []}
            displayScore={displayScore}
            onViewDetails={() => setShowScore(false)}
          />
        )}

        {/* Detailed Results */}
        {!loading && result && !showScore && (
          <div className={`animate-[fadeIn_0.4s_ease-out] transition-all duration-300 ${familyMode ? 'space-y-5' : 'space-y-4'}`}>
            {/* Top controls */}
            <div className="flex items-center justify-between">
              <button onClick={handleReset} className={`text-[#2563EB] font-medium flex items-center gap-1 hover:text-[#1d4ed8] transition-colors ${familyMode ? 'text-sm' : 'text-xs'}`}>
                <FileText className="w-3.5 h-3.5" />
                重新解读
              </button>
              <button onClick={() => setShowScore(true)} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                查看评分
              </button>
            </div>

            {/* View mode toggle: patient vs doctor */}
            <ViewModeToggle mode={viewMode} onToggle={() => setViewMode(viewMode === 'patient' ? 'doctor' : 'patient')} />

            {/* Doctor View */}
            {viewMode === 'doctor' && (
              <DoctorView indicators={result.indicators ?? []} summary={result.summary ?? ''} />
            )}

            {/* Patient View */}
            {viewMode === 'patient' && (
              <>
                <FamilyModeToggle familyMode={familyMode} onToggle={() => setFamilyMode(!familyMode)} />

                {familyMode && (
                  <div className="p-3 rounded-xl bg-[#FFFBEB] border border-amber-200 text-center">
                    <p className="text-sm text-[#D97706] font-medium">当前为家属模式 -- 字体已放大，仅显示关键信息</p>
                  </div>
                )}

                {/* Summary */}
                {familyMode ? (
                  <div className="rounded-2xl bg-[#D97706] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-white">AI 解读摘要</h2>
                    </div>
                    <p className="text-lg text-white/95 leading-[1.8]">{familySummary}</p>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl bg-white border-l-4 border-l-[#2563EB] p-5"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
                  >
                    <h2 className="text-base font-bold text-[#1A1A1A] mb-2">AI 解读摘要</h2>
                    <p className="text-sm text-[#374151] leading-relaxed">{result.summary}</p>
                  </div>
                )}

                {/* Abnormal */}
                {abnormalIndicators.length > 0 && (
                  <div className={familyMode ? 'space-y-4' : 'space-y-2'}>
                    <h3 className={`font-semibold text-[#1A1A1A] flex items-center gap-1.5 px-1 ${familyMode ? 'text-lg' : 'text-sm'}`}>
                      <AlertTriangle className={familyMode ? 'w-5 h-5 text-[#D97706]' : 'w-4 h-4 text-[#D97706]'} />
                      异常指标 ({abnormalIndicators.length})
                    </h3>
                    <div className={familyMode ? 'space-y-4' : 'space-y-3'}>
                      {abnormalIndicators.map((ind, i) =>
                        familyMode
                          ? <IndicatorCardFamily key={`abnormal-${i}`} indicator={ind} />
                          : <IndicatorCard key={`abnormal-${i}`} indicator={ind} />
                      )}
                    </div>
                  </div>
                )}

                {/* Normal */}
                {!familyMode && normalIndicators.length > 0 && (
                  <NormalIndicatorsCollapsible indicators={normalIndicators} />
                )}

                {/* Attention */}
                {(result.attention_items?.length ?? 0) > 0 && (
                  <div className={familyMode ? 'space-y-3' : 'space-y-2'}>
                    <h3 className={`font-semibold text-[#1A1A1A] flex items-center gap-1.5 px-1 ${familyMode ? 'text-lg' : 'text-sm'}`}>
                      <AlertTriangle className={familyMode ? 'w-5 h-5 text-[#D97706]' : 'w-4 h-4 text-[#D97706]'} />
                      注意事项
                    </h3>
                    <div className={familyMode ? 'space-y-3' : 'space-y-2'}>
                      {result.attention_items?.map((item, i) => (
                        <div key={i} className={`flex gap-3 rounded-xl bg-[#FFFBEB] border border-amber-200 ${familyMode ? 'p-4' : 'p-3.5'}`}>
                          <div className={`rounded-full bg-[#FFFBEB] flex items-center justify-center shrink-0 mt-0.5 ${familyMode ? 'w-6 h-6' : 'w-5 h-5'}`}>
                            <AlertTriangle className={familyMode ? 'w-4 h-4 text-[#D97706]' : 'w-3 h-3 text-[#D97706]'} />
                          </div>
                          <p className={`text-[#374151] leading-relaxed ${familyMode ? 'text-base leading-[1.8]' : 'text-xs'}`}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Family footer */}
                {familyMode && (
                  <div className="space-y-3 mt-4">
                    <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-amber-200 text-center">
                      <p className="text-lg font-bold text-[#D97706] leading-[1.8]">如有疑问，带着这个页面去找医生</p>
                    </div>
                    <a href="tel:10000" className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[#D97706] text-white font-bold text-lg hover:bg-[#B45309] active:scale-[0.98] transition-all">
                      <Phone className="w-6 h-6" />
                      打电话给子女
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <DisclaimerBar />
      <BottomNav />
    </div>
  );
}
