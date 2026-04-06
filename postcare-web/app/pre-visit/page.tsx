'use client';

import { useState } from 'react';
import {
  ClipboardList,
  Sparkles,
  Stethoscope,
  Copy,
  Check,
  ChevronDown,
  FileText,
  Clock,
  DollarSign,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { preVisitInterview, preVisitChecklist } from '@/lib/api';
import type { PreVisitResult, ChecklistResult } from '@/lib/types';

const DEPARTMENTS = [
  '内科', '外科', '妇科', '儿科', '骨科',
  '消化内科', '心内科', '神经内科', '皮肤科', '耳鼻喉科',
];

const EXAMPLE_SYMPTOMS = '最近一周头晕，早上起来特别明显，有时候恶心，血压量了偏高150/95';

type Tab = 'interview' | 'checklist';

function ImportanceBadge({ importance }: { importance: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-500/10 text-red-400',
    medium: 'bg-amber-500/10 text-amber-400',
    low: 'bg-green-500/10 text-green-400',
  };
  const labels = { high: '必带', medium: '建议', low: '可选' };
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${styles[importance]}`}>
      {labels[importance]}
    </span>
  );
}

export default function PreVisitPage() {
  const [activeTab, setActiveTab] = useState<Tab>('interview');

  // Tab 1 state
  const [symptoms, setSymptoms] = useState('');
  const [history, setHistory] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewResult, setInterviewResult] = useState<PreVisitResult | null>(null);
  const [interviewError, setInterviewError] = useState('');
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  // Tab 2 state
  const [department, setDepartment] = useState('');
  const [checklistSymptoms, setChecklistSymptoms] = useState('');
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistResult, setChecklistResult] = useState<ChecklistResult | null>(null);
  const [checklistError, setChecklistError] = useState('');
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set());
  const [checkedPreps, setCheckedPreps] = useState<Set<number>>(new Set());

  const handleInterview = async () => {
    if (!symptoms.trim()) return;
    setInterviewLoading(true);
    setInterviewError('');
    setInterviewResult(null);
    try {
      const result = await preVisitInterview(symptoms, history || undefined);
      setInterviewResult(result);
    } catch {
      setInterviewError('生成失败，请稍后重试');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleChecklist = async () => {
    if (!department) return;
    setChecklistLoading(true);
    setChecklistError('');
    setChecklistResult(null);
    setCheckedDocs(new Set());
    setCheckedPreps(new Set());
    try {
      const result = await preVisitChecklist(department, checklistSymptoms || undefined);
      setChecklistResult(result);
    } catch {
      setChecklistError('生成失败，请稍后重试');
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleCopyQuestions = async () => {
    if (!interviewResult) return;
    const questions = interviewResult.structured_symptoms?.questions_for_doctor ?? [];
    const text = questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  const toggleDoc = (idx: number) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const togglePrep = (idx: number) => {
    setCheckedPreps((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const fillExample = () => {
    setSymptoms(EXAMPLE_SYMPTOMS);
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Header stage="诊前准备" />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-20 page-enter">
        {/* Tabs */}
        <div className="flex bg-[#141E33] rounded-xl p-1 border border-white/5 mb-5">
          <button
            onClick={() => setActiveTab('interview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'interview'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            预问诊
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'checklist'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            就诊准备
          </button>
        </div>

        {/* Tab 1: 预问诊 */}
        {activeTab === 'interview' && (
          <div className="space-y-4">
            {/* Symptoms textarea */}
            <div>
              <label className="block text-sm font-semibold text-slate-100 mb-2">
                请描述您的症状，想到什么写什么，我来帮您整理
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="最近一周头晕，早上起来特别明显，有时候恶心..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#141E33] text-slate-100 text-sm leading-relaxed placeholder:text-slate-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 resize-none transition-all"
              />
              <button
                onClick={fillExample}
                className="mt-1.5 text-xs text-blue-400 hover:text-blue-400/80 font-medium transition-colors"
              >
                试试示例
              </button>
            </div>

            {/* History input */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                既往病史（可选）
              </label>
              <input
                type="text"
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder="如：高血压3年、糖尿病..."
                className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#141E33] text-slate-100 text-sm placeholder:text-slate-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleInterview}
              disabled={!symptoms.trim() || interviewLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-4 h-4" />
              帮我整理
            </button>

            {/* Loading */}
            {interviewLoading && <LoadingSpinner text="正在整理您的症状..." />}

            {/* Error */}
            {interviewError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {interviewError}
              </div>
            )}

            {/* Results */}
            {interviewResult && (
              <div className="space-y-4 mt-2">
                {/* Card 1: 主诉 */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <h3 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    主诉
                  </h3>
                  <p className="text-base font-semibold text-slate-100 leading-relaxed">
                    {interviewResult.structured_symptoms?.main_complaint}
                  </p>
                </div>

                {/* Card 2: 症状详情 */}
                <div className="rounded-xl border border-white/5 bg-[#141E33] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      症状详情
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {interviewResult.structured_symptoms?.symptom_details?.map((item, idx) => (
                      <div key={idx} className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-100 mb-1.5">{item.symptom}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>持续: {item.duration}</span>
                          <span>程度: {item.severity}</span>
                          <span>频率: {item.frequency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 3: 建议挂科 */}
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <h3 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    建议挂科
                  </h3>
                  <p className="text-lg font-bold text-slate-100">
                    {interviewResult.structured_symptoms?.suggested_department}
                  </p>
                </div>

                {/* Card 4: 问医生的问题 */}
                <div className="rounded-xl border border-white/5 bg-[#141E33] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      问医生的问题
                    </h3>
                    <button
                      onClick={handleCopyQuestions}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-400/80 font-medium transition-colors"
                    >
                      {copiedQuestions ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {interviewResult.structured_symptoms?.questions_for_doctor?.map((q, idx) => (
                      <div key={idx} className="flex gap-2.5 text-sm text-slate-100">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 5: 就诊前准备提示 */}
                <div className="rounded-xl border border-white/5 bg-[#141E33] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                      就诊前准备提示
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {(typeof interviewResult.pre_visit_tips === 'string'
                      ? interviewResult.pre_visit_tips.split(/[;；\n]/).filter(Boolean)
                      : []
                    ).map((tip, idx) => (
                      <div key={idx} className="flex gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-0.5">&#8226;</span>
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 就诊准备 */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Department dropdown */}
            <div>
              <label className="block text-sm font-semibold text-slate-100 mb-2">
                选择就诊科室
              </label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-white/5 bg-[#141E33] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all"
                >
                  <option value="">请选择科室</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Optional symptoms */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                症状描述（可选，获得更精准的清单）
              </label>
              <textarea
                value={checklistSymptoms}
                onChange={(e) => setChecklistSymptoms(e.target.value)}
                placeholder="简单描述您的症状..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#141E33] text-slate-100 text-sm leading-relaxed placeholder:text-slate-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 resize-none transition-all"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleChecklist}
              disabled={!department || checklistLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              生成准备清单
            </button>

            {/* Loading */}
            {checklistLoading && <LoadingSpinner text="正在生成准备清单..." />}

            {/* Error */}
            {checklistError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {checklistError}
              </div>
            )}

            {/* Results */}
            {checklistResult && (
              <div className="space-y-4 mt-2">
                {/* Documents checklist */}
                <div className="rounded-xl border border-white/5 bg-[#141E33] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      需要携带的材料
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {checklistResult.checklist?.documents?.map((doc, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checkedDocs.has(idx)}
                          onChange={() => toggleDoc(idx)}
                          className="w-4 h-4 rounded border-white/5 text-blue-500 focus:ring-blue-500/20 accent-blue-500"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            checkedDocs.has(idx) ? 'line-through text-slate-400' : 'text-slate-100'
                          } transition-all`}
                        >
                          {typeof doc === 'string' ? doc : doc}
                        </span>
                        <ImportanceBadge importance="medium" />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preparations */}
                <div className="rounded-xl border border-white/5 bg-[#141E33] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      就诊前准备事项
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {checklistResult.checklist?.preparation?.map((prep, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checkedPreps.has(idx)}
                          onChange={() => togglePrep(idx)}
                          className="w-4 h-4 rounded border-white/5 text-blue-500 focus:ring-blue-500/20 accent-blue-500"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            checkedPreps.has(idx) ? 'line-through text-slate-400' : 'text-slate-100'
                          } transition-all`}
                        >
                          {prep.item}
                        </span>
                        <ImportanceBadge importance={prep.importance} />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Common tests */}
                <div className="rounded-xl border border-white/5 bg-[#141E33] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
                      可能的检查项目
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {checklistResult.checklist?.common_tests?.map((test, idx) => (
                      <div key={idx} className="flex gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-0.5">&#8226;</span>
                        <span className="leading-relaxed">{test}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time and cost estimates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-400">预计时间</p>
                      <p className="text-sm font-bold text-slate-100">{checklistResult.checklist?.estimated_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <DollarSign className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-400">预计费用</p>
                      <p className="text-sm font-bold text-slate-100">{checklistResult.checklist?.cost_estimate}</p>
                    </div>
                  </div>
                </div>
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
