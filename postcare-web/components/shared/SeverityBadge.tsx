const config: Record<string, { bg: string; text: string; label: string }> = {
  normal: { bg: 'bg-green-500/10', text: 'text-green-400', label: '正常' },
  mild: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '轻度异常' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '偏高' },
  moderate: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: '中度异常' },
  severe: { bg: 'bg-red-500/10', text: 'text-red-400', label: '严重异常' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', label: '严重异常' },
  improved: { bg: 'bg-green-500/10', text: 'text-green-400', label: '好转' },
  stable: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: '稳定' },
  worsened: { bg: 'bg-red-500/10', text: 'text-red-400', label: '关注' },
};

export default function SeverityBadge({
  severity,
  label,
}: {
  severity: string;
  label?: string;
}) {
  const c = config[severity] || config.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {label || c.label}
    </span>
  );
}
