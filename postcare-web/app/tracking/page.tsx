'use client';

import { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Plus,
  Sparkles,
  Activity,
  Search,
  Trash2,
  Target,
  ShieldAlert,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { analyzeTrend, checkAlert } from '@/lib/api';
import type { TrendResult, AlertResult, AlertItem } from '@/lib/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SeverityBadge from '@/components/shared/SeverityBadge';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';

type Tab = 'trend' | 'alert';

interface HistoryRow {
  id: number;
  date: string;
  value: string;
  unit: string;
}

interface AlertRow {
  id: number;
  name: string;
  value: string;
  unit: string;
  reference: string;
}

let rowIdCounter = 0;
const nextId = () => ++rowIdCounter;

// ============================================================
// Overall level styling
// ============================================================
const levelConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  normal: { bg: 'bg-success-light', border: 'border-success', text: 'text-success', label: '全部正常' },
  mild: { bg: 'bg-warning-light', border: 'border-warning', text: 'text-warning', label: '轻度异常' },
  moderate: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', label: '中度异常' },
  severe: { bg: 'bg-danger-light', border: 'border-danger', text: 'text-danger', label: '严重异常' },
  critical: { bg: 'bg-red-200', border: 'border-red-700', text: 'text-red-800', label: '危急异常' },
};

export default function TrackingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trend');

  // === Trend state ===
  const [indicatorName, setIndicatorName] = useState('');
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([
    { id: nextId(), date: '', value: '', unit: '' },
  ]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendResult, setTrendResult] = useState<TrendResult | null>(null);
  const [trendError, setTrendError] = useState('');

  // === Alert state ===
  const [alertRows, setAlertRows] = useState<AlertRow[]>([
    { id: nextId(), name: '', value: '', unit: '', reference: '' },
  ]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResult, setAlertResult] = useState<AlertResult | null>(null);
  const [alertError, setAlertError] = useState('');

  // ----------------------------------------------------------
  // Trend helpers
  // ----------------------------------------------------------
  const addHistoryRow = () => {
    setHistoryRows((prev) => [...prev, { id: nextId(), date: '', value: '', unit: '' }]);
  };

  const updateHistoryRow = (id: number, field: keyof HistoryRow, val: string) => {
    setHistoryRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  };

  const removeHistoryRow = (id: number) => {
    setHistoryRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const fillTrendExample = () => {
    setIndicatorName('空腹血糖(GLU)');
    setHistoryRows([
      { id: nextId(), date: '2026-01-15', value: '7.8', unit: 'mmol/L' },
      { id: nextId(), date: '2026-02-20', value: '7.2', unit: 'mmol/L' },
      { id: nextId(), date: '2026-03-25', value: '6.5', unit: 'mmol/L' },
    ]);
    setTrendResult(null);
    setTrendError('');
  };

  const handleAnalyzeTrend = async () => {
    if (!indicatorName.trim()) {
      setTrendError('请输入指标名称');
      return;
    }
    const values = historyRows
      .filter((r) => r.date && r.value)
      .map((r) => ({ date: r.date, value: parseFloat(r.value), unit: r.unit }));
    if (values.length < 2) {
      setTrendError('请至少填写两次检查记录');
      return;
    }
    setTrendError('');
    setTrendLoading(true);
    setTrendResult(null);
    try {
      const res = await analyzeTrend(indicatorName, values);
      setTrendResult(res as TrendResult);
    } catch {
      setTrendError('分析失败，请稍后重试');
    } finally {
      setTrendLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Alert helpers
  // ----------------------------------------------------------
  const addAlertRow = () => {
    setAlertRows((prev) => [
      ...prev,
      { id: nextId(), name: '', value: '', unit: '', reference: '' },
    ]);
  };

  const updateAlertRow = (id: number, field: keyof AlertRow, val: string) => {
    setAlertRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  };

  const removeAlertRow = (id: number) => {
    setAlertRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const fillAlertExample = () => {
    setAlertRows([
      { id: nextId(), name: '空腹血糖', value: '8.2', unit: 'mmol/L', reference: '3.9-6.1' },
      { id: nextId(), name: '糖化血红蛋白', value: '7.5', unit: '%', reference: '4.0-6.0' },
      { id: nextId(), name: '总胆固醇', value: '5.0', unit: 'mmol/L', reference: '3.1-5.7' },
      { id: nextId(), name: '肌酐', value: '156', unit: 'umol/L', reference: '44-133' },
      { id: nextId(), name: '血红蛋白', value: '135', unit: 'g/L', reference: '120-160' },
    ]);
    setAlertResult(null);
    setAlertError('');
  };

  const handleCheckAlert = async () => {
    const indicators = alertRows
      .filter((r) => r.name && r.value)
      .map((r) => ({
        name: r.name,
        value: parseFloat(r.value),
        unit: r.unit,
        reference_range: r.reference,
      }));
    if (indicators.length === 0) {
      setAlertError('请至少填写一项指标');
      return;
    }
    setAlertError('');
    setAlertLoading(true);
    setAlertResult(null);
    try {
      const res = await checkAlert(indicators);
      setAlertResult(res as AlertResult);
    } catch {
      setAlertError('检测失败，请稍后重试');
    } finally {
      setAlertLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Sort alerts by severity
  // ----------------------------------------------------------
  const severityOrder: Record<string, number> = {
    critical: 0,
    severe: 1,
    moderate: 2,
    mild: 3,
    normal: 4,
  };

  const sortedAlerts = alertResult
    ? [...alertResult.alerts].sort(
        (a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5),
      )
    : [];

  // ----------------------------------------------------------
  // Trend direction display
  // ----------------------------------------------------------
  const trendDirectionColor = (dir: string) => {
    if (dir === 'down' || dir === 'improving') return 'text-success';
    if (dir === 'up' || dir === 'worsening') return 'text-danger';
    return 'text-warning';
  };

  const trendDirectionArrow = (dir: string) => {
    if (dir === 'down' || dir === 'improving') return ' \u2193';
    if (dir === 'up' || dir === 'worsening') return ' \u2191';
    return ' \u2192';
  };

  // ==========================================================
  return (
    <div className="min-h-screen bg-white">
      <Header stage="健康追踪" />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-20 page-enter">
        {/* Tab bar */}
        <div className="flex rounded-xl bg-gray-50 border border-gray-100 p-1 mb-5">
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'trend'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            指标趋势
          </button>
          <button
            onClick={() => setActiveTab('alert')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'alert'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            异常预警
          </button>
        </div>

        {/* ====== TAB 1 : 指标趋势 ====== */}
        {activeTab === 'trend' && (
          <div className="space-y-4">
            {/* Indicator name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">指标名称</label>
              <input
                type="text"
                value={indicatorName}
                onChange={(e) => setIndicatorName(e.target.value)}
                placeholder="如：空腹血糖(GLU)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
              />
            </div>

            {/* History values table */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">历史检查记录</label>
              <div className="space-y-2">
                {historyRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateHistoryRow(row.id, 'date', e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    />
                    <input
                      type="number"
                      step="any"
                      value={row.value}
                      onChange={(e) => updateHistoryRow(row.id, 'value', e.target.value)}
                      placeholder="数值"
                      className="w-20 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    />
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateHistoryRow(row.id, 'unit', e.target.value)}
                      placeholder="单位"
                      className="w-20 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    />
                    <button
                      onClick={() => removeHistoryRow(row.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-danger hover:bg-danger-light transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addHistoryRow}
                className="mt-2 flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-600/80 transition"
              >
                <Plus className="w-4 h-4" />
                添加一次检查记录
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={fillTrendExample}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:border-blue-600 hover:text-blue-600 transition"
              >
                <Sparkles className="w-4 h-4" />
                试试示例
              </button>
              <button
                onClick={handleAnalyzeTrend}
                disabled={trendLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-600/90 disabled:opacity-50 transition shadow-sm"
              >
                <Activity className="w-4 h-4" />
                分析趋势
              </button>
            </div>

            {trendError && (
              <p className="text-sm text-danger text-center">{trendError}</p>
            )}

            {trendLoading && <LoadingSpinner text="正在分析趋势..." />}

            {/* Trend Result */}
            {trendResult && !trendLoading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Chart */}
                <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    {indicatorName} 趋势图
                  </h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendResult.chart_data}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        {trendResult.reference_line?.low != null &&
                          trendResult.reference_line?.high != null && (
                            <ReferenceArea
                              y1={trendResult.reference_line.low}
                              y2={trendResult.reference_line.high}
                              fill="#94A3B8"
                              fillOpacity={0.1}
                              label={{
                                value: '正常范围',
                                position: 'insideTopRight',
                                fontSize: 11,
                                fill: '#94A3B8',
                              }}
                            />
                          )}
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                          tickLine={false}
                          axisLine={{ stroke: '#E2E8F0' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                          tickLine={false}
                          axisLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            fontSize: '13px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          }}
                          formatter={(value: unknown) => [String(value), indicatorName]}
                          labelFormatter={(label: unknown) => `日期: ${String(label)}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          dot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trend label */}
                <div className="flex items-center justify-center">
                  <span
                    className={`text-2xl font-bold ${trendDirectionColor(trendResult.trend_direction)}`}
                  >
                    {trendResult.trend_label}
                    {trendDirectionArrow(trendResult.trend_direction)}
                  </span>
                </div>

                {/* Analysis */}
                <div className="p-4 rounded-2xl bg-white border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">趋势分析</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {trendResult.analysis}
                  </p>
                </div>

                {/* Next target */}
                {trendResult.next_target && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-600/20">
                    <div className="flex items-start gap-2">
                      <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-600 mb-1">下次目标</h4>
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {trendResult.next_target}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ====== TAB 2 : 异常预警 ====== */}
        {activeTab === 'alert' && (
          <div className="space-y-4">
            {/* Indicator rows */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">检查指标</label>
              <div className="space-y-2">
                {alertRows.map((row) => (
                  <div key={row.id} className="p-3 rounded-xl border border-gray-100 bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateAlertRow(row.id, 'name', e.target.value)}
                        placeholder="指标名称"
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                      />
                      <button
                        onClick={() => removeAlertRow(row.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-danger hover:bg-danger-light transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={row.value}
                        onChange={(e) => updateAlertRow(row.id, 'value', e.target.value)}
                        placeholder="数值"
                        className="w-24 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                      />
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => updateAlertRow(row.id, 'unit', e.target.value)}
                        placeholder="单位"
                        className="w-20 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                      />
                      <input
                        type="text"
                        value={row.reference}
                        onChange={(e) => updateAlertRow(row.id, 'reference', e.target.value)}
                        placeholder="参考范围 如 3.9-6.1"
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-500/50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addAlertRow}
                className="mt-2 flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-600/80 transition"
              >
                <Plus className="w-4 h-4" />
                添加一项指标
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={fillAlertExample}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:border-blue-600 hover:text-blue-600 transition"
              >
                <Sparkles className="w-4 h-4" />
                试试示例
              </button>
              <button
                onClick={handleCheckAlert}
                disabled={alertLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-600/90 disabled:opacity-50 transition shadow-sm"
              >
                <Search className="w-4 h-4" />
                检测预警
              </button>
            </div>

            {alertError && (
              <p className="text-sm text-danger text-center">{alertError}</p>
            )}

            {alertLoading && <LoadingSpinner text="正在检测异常..." />}

            {/* Alert Result */}
            {alertResult && !alertLoading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Overall level banner */}
                {(() => {
                  const lc =
                    levelConfig[alertResult.alert_level] || levelConfig.normal;
                  return (
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border-l-4 ${lc.bg} ${lc.border}`}
                    >
                      <ShieldAlert className={`w-6 h-6 flex-shrink-0 ${lc.text}`} />
                      <div>
                        <p className={`text-lg font-bold ${lc.text}`}>{lc.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          共检测 {alertResult.alerts.length} 项指标
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Alert cards */}
                {sortedAlerts.map((item: AlertItem, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl bg-white border border-gray-100 shadow-sm ${
                      item.severity === 'critical' ? '' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{item.indicator}</span>
                        <SeverityBadge severity={item.severity} />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-2">
                      {item.message}
                    </p>
                    {item.action && (
                      <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-blue-50">
                        <Target className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-900 leading-relaxed">{item.action}</p>
                      </div>
                    )}
                  </div>
                ))}
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
