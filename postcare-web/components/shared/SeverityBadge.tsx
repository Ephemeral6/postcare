const config: Record<string, { bg: string; text: string; label: string }> = {
  normal:   { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', label: '正常' },
  mild:     { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', label: '轻度异常' },
  high:     { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', label: '偏高' },
  moderate: { bg: 'bg-orange-50',  text: 'text-orange-600', label: '中度异常' },
  severe:   { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: '严重异常' },
  critical: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: '严重异常' },
  improved: { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', label: '好转' },
  stable:   { bg: 'bg-gray-100',   text: 'text-gray-500',  label: '稳定' },
  worsened: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: '关注' },
};

export default function SeverityBadge({ severity, label }: { severity: string; label?: string }) {
  const c = config[severity] || config.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      {label || c.label}
    </span>
  );
}
