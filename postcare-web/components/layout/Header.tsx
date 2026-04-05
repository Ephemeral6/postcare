'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Header({ stage }: { stage?: string }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 glass border-b border-white/40">
      <Link href="/" className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400">
          <Heart className="w-5 h-5 text-white fill-white" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
        </div>
        <span className="text-lg font-bold text-text">PostCare</span>
      </Link>
      {stage && (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-light text-primary">
          {stage}
        </span>
      )}
    </header>
  );
}
