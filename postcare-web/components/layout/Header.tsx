'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Header({ stage }: { stage?: string }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Heart className="w-4 h-4 text-blue-400" />
        </div>
        <span className="font-bold text-white text-sm">PostCare</span>
      </Link>
      {stage && (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {stage}
        </span>
      )}
    </header>
  );
}
