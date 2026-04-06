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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-white border-t border-gray-100">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              isActive
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 w-5 h-0.5 rounded-full bg-blue-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
