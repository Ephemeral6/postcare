'use client';

import { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pill,
  Leaf,
  Sun,
  CloudSun,
  Moon,
  Info,
  ShieldAlert,
  Utensils,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { analyzeMedication } from '@/lib/api';
import type { MedicationResult, DrugInfo } from '@/lib/types';

const EXAMPLE_DRUGS = ['奥美拉唑', '阿莫西林', '六味地黄丸'];

function mealTimingColor(timing: string) {
  if (timing.includes('饭前')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (timing.includes('饭后')) return 'bg-green-50 text-green-700 border-green-200';
  if (timing.includes('睡前')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

function mealTimingDot(timing: string) {
  if (timing.includes('饭前')) return 'bg-amber-400';
  if (timing.includes('饭后')) return 'bg-green-400';
  if (timing.includes('睡前')) return 'bg-indigo-400';
  return 'bg-gray-400';
}

// --------------- Drug Input ---------------
function DrugInput({
  drugs,
  onAdd,
  onRemove,
  onFillExample,
}: {
  drugs: string[];
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
  onFillExample: () => void;
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
    <div className="bg-white rounded-[18px] border border-border p-4 shadow-[var(--shadow-soft)]">
      <label className="text-sm font-semibold text-text mb-2 flex items-center gap-1.5">
        <Pill className="w-4 h-4 text-primary" />
        输入药品
      </label>
      <div
        className="flex flex-wrap gap-2 min-h-[44px] p-2.5 rounded-xl border border-border bg-background cursor-text focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
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
          placeholder={drugs.length === 0 ? '输入药品名称，按回车添加' : '继续添加...'}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-text placeholder:text-text-secondary/60"
        />
      </div>
      <button
        onClick={onFillExample}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        试试示例
      </button>
    </div>
  );
}

// --------------- Schedule Timeline ---------------
function ScheduleTimeline({
  schedule,
  drugs,
}: {
  schedule: MedicationResult['schedule'];
  drugs: DrugInfo[];
}) {
  const drugMap = new Map(drugs.map((d) => [d.name, d]));

  const periods = [
    { key: 'morning' as const, label: '早上', time: '08:00', icon: Sun, color: 'from-orange-400 to-amber-300' },
    { key: 'noon' as const, label: '中午', time: '12:00', icon: CloudSun, color: 'from-sky-400 to-blue-300' },
    { key: 'evening' as const, label: '晚上', time: '20:00', icon: Moon, color: 'from-indigo-500 to-purple-400' },
  ];

  return (
    <div className="bg-white rounded-[18px] border border-border shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-primary" />
          服药时间表
        </h3>
      </div>

      {/* Timeline connector */}
      <div className="relative px-4 pb-4">
        <div className="absolute left-[39px] top-0 bottom-4 w-px border-l-2 border-dashed border-primary/20" />

        <div className="space-y-4">
          {periods.map((period) => {
            const drugNames = schedule[period.key];
            const Icon = period.icon;
            return (
              <div key={period.key} className="relative flex gap-3">
                {/* Time circle */}
                <div className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${period.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-sm font-bold text-text">{period.label}</span>
                    <span className="text-xs text-text-secondary">{period.time}</span>
                  </div>

                  {drugNames.length === 0 ? (
                    <p className="text-xs text-text-secondary italic">无需服药</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {drugNames.map((name) => {
                        const drug = drugMap.get(name);
                        const timing = drug?.relation_to_meal || '';
                        return (
                          <span
                            key={name}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${mealTimingColor(timing)}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${mealTimingDot(timing)}`} />
                            {name}
                            {timing && (
                              <span className="opacity-70 ml-0.5">({timing})</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-t border-border flex flex-wrap gap-3">
        {[
          { label: '饭前', cls: 'bg-amber-400' },
          { label: '饭后', cls: 'bg-green-400' },
          { label: '睡前', cls: 'bg-indigo-400' },
        ].map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
            <span className={`w-2 h-2 rounded-full ${item.cls}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// --------------- Drug Card ---------------
function DrugCard({ drug }: { drug: DrugInfo }) {
  const [showContra, setShowContra] = useState(false);
  const isTCM = drug.is_tcm === true;

  return (
    <div
      className={`bg-white rounded-[18px] border shadow-[var(--shadow-soft)] overflow-hidden ${
        isTCM ? 'border-amber-200' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isTCM ? (
            <Leaf className="w-4 h-4 text-amber-600" />
          ) : (
            <Pill className="w-4 h-4 text-primary" />
          )}
          <h4 className="text-sm font-bold text-text">{drug.name}</h4>
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
            isTCM
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-primary-light text-primary'
          }`}
        >
          {isTCM ? '中成药' : '西药'}
        </span>
      </div>

      {/* Info grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <InfoItem label="功能" value={drug.function_simple || '-'} />
        <InfoItem label="剂量" value={drug.dosage} />
        <InfoItem label="服药时机" value={drug.relation_to_meal || '-'} />
        <InfoItem label="用法" value={drug.timing} />
      </div>

      {/* Dietary notes (food_warnings) */}
      {(drug.food_warnings ?? []).length > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
          <div className="flex items-center gap-1 mb-1">
            <Utensils className="w-3 h-3 text-green-600" />
            <span className="text-[11px] font-semibold text-green-700">饮食提示</span>
          </div>
          <ul className="space-y-0.5">
            {drug.food_warnings?.map((note, i) => (
              <li key={i} className="text-xs text-green-800 leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsible: Contraindications */}
      {(drug.contraindications ?? []).length > 0 && (
        <CollapsibleSection
          title="禁忌事项"
          open={showContra}
          onToggle={() => setShowContra(!showContra)}
          color="danger"
        >
          <ul className="space-y-1">
            {drug.contraindications.map((c, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-danger mt-1.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2.5 py-1.5 rounded-lg bg-background">
      <p className="text-[10px] text-text-secondary mb-0.5">{label}</p>
      <p className="text-xs font-medium text-text">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  color,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  color: 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const colorMap = {
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <div className="border-t border-dashed border-danger/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className={`text-xs font-medium ${colorMap[color]}`}>{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// --------------- Interaction Warnings ---------------
function InteractionWarnings({
  interactions,
}: {
  interactions: MedicationResult['interactions'];
}) {
  if (interactions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-danger" />
        药物相互作用
      </h3>
      {interactions.map((inter, i) => {
        const isHigh = inter.severity === '严重' || inter.severity === 'high';
        return (
          <div
            key={i}
            className={`rounded-xl border p-3 ${
              isHigh
                ? 'bg-danger-light border-danger/30'
                : 'bg-warning-light border-warning/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert
                className={`w-4 h-4 ${isHigh ? 'text-danger' : 'text-warning'}`}
              />
              <span className="text-xs font-bold text-text">
                {inter.drug_a} <span className="text-text-secondary mx-1">&#8596;</span>{' '}
                {inter.drug_b}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isHigh
                    ? 'bg-danger/10 text-danger'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                {inter.severity}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {inter.warning}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// --------------- TCM-Western Notes ---------------
function TCMWesternNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-bold text-amber-800">中西药服用提示</h3>
      </div>
      <ul className="space-y-1.5">
        {notes.map((note, i) => (
          <li
            key={i}
            className="text-xs text-amber-900 leading-relaxed flex items-start gap-1.5"
          >
            <Leaf className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --------------- Page ---------------
export default function MedicationPage() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicationResult | null>(null);
  const [error, setError] = useState('');

  const addDrug = (name: string) => {
    if (!drugs.includes(name)) {
      setDrugs([...drugs, name]);
    }
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const fillExample = () => {
    setDrugs(EXAMPLE_DRUGS);
  };

  const handleAnalyze = async () => {
    if (drugs.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeMedication(drugs);
      setResult(data as MedicationResult);
    } catch {
      setError('分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header stage="用药管家" />

      <main className="page-enter max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">
        {/* Drug input */}
        <DrugInput
          drugs={drugs}
          onAdd={addDrug}
          onRemove={removeDrug}
          onFillExample={fillExample}
        />

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={drugs.length === 0 || loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-blue-500 text-white text-sm font-bold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
        >
          分析用药方案
        </button>

        {/* Loading */}
        {loading && <LoadingSpinner text="正在分析用药方案..." />}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-danger-light border border-danger/20 text-danger text-sm text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Schedule Timeline */}
            <ScheduleTimeline schedule={result.schedule} drugs={result.drugs} />

            {/* Interaction Warnings */}
            <InteractionWarnings interactions={result.interactions} />

            {/* TCM-Western Notes */}
            <TCMWesternNotes notes={result.tcm_western_warnings} />

            {/* Drug cards */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-primary" />
                药品详情
              </h3>
              {result.drugs.map((drug) => (
                <DrugCard key={drug.name} drug={drug} />
              ))}
            </div>
          </div>
        )}
      </main>

      <DisclaimerBar />
      <BottomNav />
    </div>
  );
}
