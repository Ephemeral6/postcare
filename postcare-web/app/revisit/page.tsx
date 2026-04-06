'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import {
  Plus,
  Trash2,
  X,
  Copy,
  Check,
  ClipboardList,
  Sparkles,
  Stethoscope,
  MessageSquareText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { generateRevisit } from '@/lib/api';
import type { RevisitResult } from '@/lib/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SeverityBadge from '@/components/shared/SeverityBadge';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';

interface IndicatorRow {
  name: string;
  value: string;
  unit: string;
}

const emptyRow = (): IndicatorRow => ({ name: '', value: '', unit: '' });

export default function RevisitPage() {
  // ---- input state ----
  const [originalDate, setOriginalDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [originalRows, setOriginalRows] = useState<IndicatorRow[]>([emptyRow()]);
  const [newRows, setNewRows] = useState<IndicatorRow[]>([emptyRow()]);
  const [medications, setMedications] = useState<string[]>([]);
  const [medInput, setMedInput] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // ---- result state ----
  const [result, setResult] = useState<RevisitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- clipboard feedback ----
  const [copiedQ, setCopiedQ] = useState(false);
  const [copiedD, setCopiedD] = useState(false);

  // ---- helpers ----
  const updateRow = (
    setter: typeof setOriginalRows,
    index: number,
    field: keyof IndicatorRow,
    value: string,
  ) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = (setter: typeof setOriginalRows) =>
    setter((prev) => [...prev, emptyRow()]);

  const removeRow = (setter: typeof setOriginalRows, index: number) =>
    setter((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleMedKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && medInput.trim()) {
      e.preventDefault();
      if (!medications.includes(medInput.trim())) {
        setMedications((prev) => [...prev, medInput.trim()]);
      }
      setMedInput('');
    }
  };

  const removeMed = (med: string) =>
    setMedications((prev) => prev.filter((m) => m !== med));

  // ---- example data ----
  const fillExample = () => {
    setOriginalDate('2026-02-15');
    setNewDate('2026-03-20');
    setOriginalRows([
      { name: 'ALT', value: '85', unit: 'U/L' },
      { name: 'AST', value: '62', unit: 'U/L' },
      { name: 'GLU', value: '6.3', unit: 'mmol/L' },
    ]);
    setNewRows([
      { name: 'ALT', value: '45', unit: 'U/L' },
      { name: 'AST', value: '38', unit: 'U/L' },
      { name: 'GLU', value: '6.5', unit: 'mmol/L' },
    ]);
    setMedications(['护肝片', '二甲双胍']);
    setSymptoms('最近没什么不舒服，偶尔饭后有点胀');
    setResult(null);
    setError('');
  };

  // ---- submit ----
  const handleSubmit = useCallback(async () => {
    const validOld = originalRows.filter((r) => r.name && r.value);
    const validNew = newRows.filter((r) => r.name && r.value);
    if (validOld.length === 0 || validNew.length === 0) {
      setError('请至少填写一项上次和本次的检查指标');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const originalReport = { date: originalDate, indicators: validOld };
      const newReport = { date: newDate, indicators: validNew };
      const data: RevisitResult = await generateRevisit(
        originalReport,
        newReport,
        medications,
        symptoms || undefined,
      );
      setResult(data);
    } catch {
      setError('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [originalDate, newDate, originalRows, newRows, medications, symptoms]);

  // ---- clipboard ----
  const copyQuestions = async () => {
    if (!result) return;
    const questions = result.revisit_summary?.suggested_questions_for_doctor ?? [];
    const text = questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedQ(true);
    setTimeout(() => setCopiedQ(false), 2000);
  };

  const copyDoctorView = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.doctor_view);
    setCopiedD(true);
    setTimeout(() => setCopiedD(false), 2000);
  };

  // ---- row change icon ----
  const changeIcon = (status: string) => {
    if (status === 'improved')
      return <ArrowDownRight className="w-4 h-4 text-green-400" />;
    if (status === 'worsened')
      return <ArrowUpRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  const rowBg = (status: string) => {
    if (status === 'improved') return 'bg-green-500/5';
    if (status === 'worsened') return 'bg-red-500/5';
    return 'bg-white/5';
  };

  // ---- render helpers ----
  const renderIndicatorPanel = (
    label: string,
    rows: IndicatorRow[],
    setter: typeof setOriginalRows,
    date: string,
    setDate: typeof setOriginalDate,
  ) => (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-slate-100 mb-2">{label}</h3>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded-lg border border-white/5 text-sm text-slate-100 bg-[#141E33] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              placeholder="指标名"
              value={row.name}
              onChange={(e) => updateRow(setter, i, 'name', e.target.value)}
              className="flex-[2] min-w-0 px-2.5 py-1.5 rounded-lg border border-white/5 text-sm text-slate-100 bg-[#141E33] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              placeholder="值"
              value={row.value}
              onChange={(e) => updateRow(setter, i, 'value', e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-white/5 text-sm text-slate-100 bg-[#141E33] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              placeholder="单位"
              value={row.unit}
              onChange={(e) => updateRow(setter, i, 'unit', e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-white/5 text-sm text-slate-100 bg-[#141E33] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={() => removeRow(setter, i)}
              className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
              aria-label="删除指标"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => addRow(setter)}
        className="mt-2 flex items-center gap-1 text-xs text-blue-400 font-medium hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        添加指标
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Header stage="复诊准备" />

      <main className="max-w-lg mx-auto px-4 pt-5 pb-20 page-enter">
        {/* Title */}
        <div className="flex items-center gap-2 mb-5">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-slate-100">复诊准备</h1>
        </div>

        {/* Input section */}
        <section className="p-4 rounded-xl bg-[#141E33] border border-white/5 space-y-5">
          {/* Two-column indicators */}
          <div className="flex flex-col sm:flex-row gap-5">
            {renderIndicatorPanel(
              '上次报告',
              originalRows,
              setOriginalRows,
              originalDate,
              setOriginalDate,
            )}
            {renderIndicatorPanel(
              '本次报告',
              newRows,
              setNewRows,
              newDate,
              setNewDate,
            )}
          </div>

          {/* Medications tag input */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">正在服用的药物</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {medications.map((med) => (
                <span
                  key={med}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium"
                >
                  {med}
                  <button
                    onClick={() => removeMed(med)}
                    className="hover:text-red-400 transition-colors"
                    aria-label={`移除${med}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={medInput}
              onChange={(e) => setMedInput(e.target.value)}
              onKeyDown={handleMedKeyDown}
              placeholder="输入药物名称，按回车添加"
              className="w-full px-3 py-2 rounded-lg border border-white/5 text-sm text-slate-100 bg-[#141E33] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Symptoms update */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">症状变化（选填）</h3>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="描述一下最近身体感觉怎么样..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-white/5 text-sm text-slate-100 bg-[#141E33] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={fillExample}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/5 text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              试试示例
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <ClipboardList className="w-4 h-4" />
              生成复诊报告
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6">
            <LoadingSpinner text="正在生成复诊报告..." />
          </div>
        )}

        {/* Results */}
        {result && !loading && (() => {
          // Flatten the three categorized arrays into a unified comparison array
          const comparison = [
            ...(result.revisit_summary?.improvements ?? []).map((item) => ({
              name: item.indicator,
              old_value: item.before,
              new_value: item.after,
              change_percent: item.change,
              status: 'improved' as const,
              assessment: item.assessment,
            })),
            ...(result.revisit_summary?.concerns ?? []).map((item) => ({
              name: item.indicator,
              old_value: item.before,
              new_value: item.after,
              change_percent: item.change,
              status: 'worsened' as const,
              assessment: item.assessment,
            })),
            ...(result.revisit_summary?.stable ?? []).map((item) => ({
              name: item.indicator,
              old_value: item.before,
              new_value: item.after,
              change_percent: item.change,
              status: 'stable' as const,
              assessment: item.assessment,
            })),
          ];
          const questionsForDoctor = result.revisit_summary?.suggested_questions_for_doctor ?? [];

          return (
          <div className="mt-6 space-y-5">
            {/* Comparison table */}
            <section className="rounded-xl bg-[#141E33] border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-400" />
                  指标对比
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 text-xs">
                      <th className="text-left px-4 py-2.5 font-medium">指标</th>
                      <th className="text-center px-3 py-2.5 font-medium">上次</th>
                      <th className="text-center px-3 py-2.5 font-medium">本次</th>
                      <th className="text-center px-3 py-2.5 font-medium">变化</th>
                      <th className="text-center px-3 py-2.5 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item, i) => (
                      <tr
                        key={i}
                        className={`${rowBg(item.status)} border-t border-white/5 hover:brightness-110 transition-all`}
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-100">
                          {item.name}
                        </td>
                        <td className="text-center px-3 py-2.5 text-slate-400">
                          {item.old_value}
                        </td>
                        <td className="text-center px-3 py-2.5 text-slate-100">
                          {item.new_value}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <span className="inline-flex items-center gap-0.5">
                            {changeIcon(item.status)}
                            <span
                              className={`text-xs font-medium ${
                                item.status === 'improved'
                                  ? 'text-green-400'
                                  : item.status === 'worsened'
                                    ? 'text-red-400'
                                    : 'text-slate-400'
                              }`}
                            >
                              {item.change_percent}
                            </span>
                          </span>
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <SeverityBadge severity={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Questions for doctor */}
            {questionsForDoctor.length > 0 && (
              <section className="p-4 rounded-xl bg-[#141E33] border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <MessageSquareText className="w-4 h-4 text-blue-400" />
                    复诊时可以问医生
                  </h2>
                  <button
                    onClick={copyQuestions}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:opacity-80 transition-opacity"
                  >
                    {copiedQ ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        复制全部
                      </>
                    )}
                  </button>
                </div>
                <ol className="space-y-2">
                  {questionsForDoctor.map((q, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-sm text-slate-100 leading-relaxed"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Doctor brief card */}
            <section className="relative p-4 rounded-xl bg-[#141E33] border border-white/10">
              <button
                onClick={copyDoctorView}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-300 bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
              >
                {copiedD ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    复制
                  </>
                )}
              </button>
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 mb-2">给医生看</span>
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                给医生看的简报
              </h2>
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap pr-16">
                {result.doctor_view}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                复诊时把这段话给医生看，他10秒就能了解您的情况
              </p>
            </section>
          </div>
          );
        })()}
      </main>

      <DisclaimerBar />
      <BottomNav />
    </div>
  );
}
