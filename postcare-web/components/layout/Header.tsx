'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Header({ stage }: { stage?: string }) {
  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-5 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">PostCare</span>
      </Link>
      {stage && (
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {stage}
        </span>
      )}
    </header>
  );
}
