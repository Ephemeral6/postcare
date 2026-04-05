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
    <nav className="fixed bottom-3 left-4 right-4 z-50 flex items-center justify-around h-14 max-w-lg mx-auto rounded-2xl glass border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? 'text-primary'
                : 'text-text-secondary hover:text-primary/70'
            }`}
          >
            <Icon className={`w-5 h-5 transition-all ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
