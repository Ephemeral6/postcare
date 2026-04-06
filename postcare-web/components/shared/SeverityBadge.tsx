const config: Record<string, { bg: string; text: string; label: string }> = {
  normal:   { bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: '���常' },
  mild:     { bg: 'bg-amber-400/10',   text: 'text-amber-400',   label: '轻度异常' },
  high:     { bg: 'bg-amber-400/10',   text: 'text-amber-400',   label: '偏高' },
  moderate: { bg: 'bg-orange-400/10',  text: 'text-orange-400',  label: '中度异��' },
  severe:   { bg: 'bg-red-400/10',     text: 'text-red-400',     label: '严重异常' },
  critical: { bg: 'bg-red-400/10',     text: 'text-red-400',     label: '严重异常' },
  improved: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: '好转' },
  stable:   { bg: 'bg-zinc-400/10',    text: 'text-zinc-400',    label: '稳定' },
  worsened: { bg: 'bg-red-400/10',     text: 'text-red-400',     label: '关注' },
};

export default function SeverityBadge({ severity, label }: { severity: string; label?: string }) {
  const c = config[severity] || config.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      {label || c.label}
    </span>
  );
}
