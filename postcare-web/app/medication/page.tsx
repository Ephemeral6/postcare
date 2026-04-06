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
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
        <Pill className="w-4 h-4 text-blue-600" />
        输入药品
      </label>
      <div
        className="flex flex-wrap gap-2 min-h-[44px] p-2.5 rounded-xl border border-gray-200 bg-white cursor-text focus-within:border-blue-600/50 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {drugs.map((drug, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium"
          >
            {drug}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
              }}
              className="ml-0.5 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
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
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>
      <button
        onClick={onFillExample}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
    { key: 'morning' as const, label: '早上', time: '08:00', icon: Sun, color: 'bg-amber-500' },
    { key: 'noon' as const, label: '中午', time: '12:00', icon: CloudSun, color: 'bg-blue-500' },
    { key: 'evening' as const, label: '晚上', time: '20:00', icon: Moon, color: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-600" />
          服药时间表
        </h3>
      </div>

      <div className="relative px-4 pb-4">
        <div className="absolute left-[39px] top-0 bottom-4 w-px border-l-2 border-dashed border-blue-100" />

        <div className="space-y-4">
          {periods.map((period) => {
            const drugNames = schedule[period.key];
            const Icon = period.icon;
            return (
              <div key={period.key} className="relative flex gap-3">
                <div className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-xl ${period.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-sm font-bold text-gray-900">{period.label}</span>
                    <span className="text-xs text-gray-400">{period.time}</span>
                  </div>

                  {drugNames.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">无需服药</p>
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

      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
        {[
          { label: '饭前', cls: 'bg-amber-400' },
          { label: '饭后', cls: 'bg-green-400' },
          { label: '睡前', cls: 'bg-indigo-400' },
        ].map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1 text-[11px] text-gray-400">
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
      className={`bg-white rounded-xl border overflow-hidden ${
        isTCM ? 'border-amber-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isTCM ? (
            <Leaf className="w-4 h-4 text-amber-600" />
          ) : (
            <Pill className="w-4 h-4 text-blue-600" />
          )}
          <h4 className="text-sm font-bold text-gray-900">{drug.name}</h4>
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
            isTCM
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-blue-50 text-blue-600'
          }`}
        >
          {isTCM ? '中成药' : '西药'}
        </span>
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <InfoItem label="功能" value={drug.function_simple || '-'} />
        <InfoItem label="剂量" value={drug.dosage} />
        <InfoItem label="服药时机" value={drug.relation_to_meal || '-'} />
        <InfoItem label="用法" value={drug.timing} />
      </div>

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

      {(drug.contraindications ?? []).length > 0 && (
        <CollapsibleSection
          title="禁忌事项"
          open={showContra}
          onToggle={() => setShowContra(!showContra)}
          color="danger"
        >
          <ul className="space-y-1">
            {drug.contraindications.map((c, i) => (
              <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
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
    <div className="px-2.5 py-1.5 rounded-lg bg-gray-50">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-medium text-gray-900">{value}</p>
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
    warning: 'text-amber-500',
    danger: 'text-red-500',
  };

  return (
    <div className="border-t border-dashed border-red-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className={`text-xs font-medium ${colorMap[color]}`}>{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
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
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        药物相互作用
      </h3>
      {interactions.map((inter, i) => {
        const isHigh = inter.severity === '严重' || inter.severity === 'high';
        return (
          <div
            key={i}
            className={`rounded-xl border p-3 ${
              isHigh
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert
                className={`w-4 h-4 ${isHigh ? 'text-red-500' : 'text-amber-500'}`}
              />
              <span className="text-xs font-bold text-gray-900">
                {inter.drug_a} <span className="text-gray-400 mx-1">&#8596;</span>{' '}
                {inter.drug_b}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isHigh
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {inter.severity}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
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
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
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
    <div className="min-h-screen bg-white">
      <Header stage="用药管家" />

      <main className="page-enter max-w-lg mx-auto px-4 pt-4 pb-20 space-y-4">
        <DrugInput
          drugs={drugs}
          onAdd={addDrug}
          onRemove={removeDrug}
          onFillExample={fillExample}
        />

        <button
          onClick={handleAnalyze}
          disabled={drugs.length === 0 || loading}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
        >
          分析用药方案
        </button>

        {loading && <LoadingSpinner text="正在分析用药方案..." />}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <ScheduleTimeline schedule={result.schedule} drugs={result.drugs} />
            <InteractionWarnings interactions={result.interactions} />
            <TCMWesternNotes notes={result.tcm_western_warnings} />

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-blue-600" />
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
