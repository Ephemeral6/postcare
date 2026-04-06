'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Stethoscope, FileText, Activity, TrendingUp, ClipboardList } from 'lucide-react';

const navItems = [
  { href: '/pre-visit', icon: Stethoscope, label: '诊前' },
  { href: '/report', icon: FileText, label: '报告' },
  { href: '/journey', icon: Activity, label: '旅程' },
  { href: '/tracking', icon: TrendingUp, label: '追踪' },
  { href: '/revisit', icon: ClipboardList, label: '复诊' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around bg-white/90 backdrop-blur-xl border-t border-black/[0.04]">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${isActive ? 'text-[#2563EB]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}>
            <Icon className={`w-[18px] h-[18px] ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            {isActive && <div className="absolute bottom-0 w-5 h-[2px] rounded-full bg-[#2563EB]" />}
          </Link>
        );
      })}
    </nav>
  );
}
