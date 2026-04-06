'use client';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Header({ stage }: { stage?: string }) {
  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-5 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="text-sm font-bold text-[#1A1A1A]">PostCare</span>
      </Link>
      {stage && (
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB]">
          {stage}
        </span>
      )}
    </header>
  );
}
