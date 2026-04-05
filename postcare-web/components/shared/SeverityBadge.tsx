const config: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
  normal: { bg: 'bg-success-light', text: 'text-success', label: '正常' },
  mild: { bg: 'bg-warning-light', text: 'text-warning', label: '轻度异常' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700', label: '偏高' },
  moderate: { bg: 'bg-orange-100', text: 'text-orange-700', label: '中度异常' },
  severe: { bg: 'bg-danger-light', text: 'text-danger', label: '严重异常', pulse: true },
  critical: { bg: 'bg-danger-light', text: 'text-danger', label: '严重异常', pulse: true },
  improved: { bg: 'bg-success-light', text: 'text-success', label: '好转' },
  stable: { bg: 'bg-gray-100', text: 'text-gray-600', label: '稳定' },
  worsened: { bg: 'bg-danger-light', text: 'text-danger', label: '关注' },
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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} ${
        c.pulse ? 'animate-critical-pulse' : ''
      }`}
    >
      {label || c.label}
    </span>
  );
}
