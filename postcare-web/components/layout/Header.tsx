'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Header({ stage }: { stage?: string }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">PostCare</span>
      </Link>
      {stage && (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
          {stage}
        </span>
      )}
    </header>
  );
}
