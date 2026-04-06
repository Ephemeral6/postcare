'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Stethoscope, FileText, Pill, TrendingUp, ClipboardList, ChevronRight, Activity } from 'lucide-react';

const HERO_TEXT = '让医生在诊室里来不及说的话，在你最需要的时候被听见。';

const journeyStages = [
  { title: '诊前', subtitle: '预问诊', icon: Stethoscope, href: '/pre-visit' },
  { title: '报告', subtitle: '解读', icon: FileText, href: '/report' },
  { title: '管理', subtitle: '用药', icon: Pill, href: '/medication' },
  { title: '追踪', subtitle: '趋势', icon: TrendingUp, href: '/tracking' },
  { title: '复诊', subtitle: '准备', icon: ClipboardList, href: '/revisit' },
];

export default function Home() {
  const [typed, setTyped] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(HERO_TEXT.slice(0, i));
      if (i >= HERO_TEXT.length) {
        clearInterval(iv);
        // Hide cursor 2s after typing finishes
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#09090b] pb-20"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    >
      {/* Header / Hero */}
      <div className="px-6 pt-12 pb-10">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Heart className="w-4 h-4 text-indigo-400 fill-indigo-400" />
          </div>
          <span className="text-[15px] font-semibold text-zinc-50 tracking-tight">PostCare</span>
        </div>

        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight leading-snug mb-3 min-h-[4em]">
          {typed}
          {showCursor && <span className="cursor-blink text-indigo-400 ml-0.5">|</span>}
        </h1>
        <p className="text-sm text-zinc-400">
          覆盖诊前→诊后→回家→追踪→复诊的完整旅程
        </p>
      </div>

      {/* Journey CTA — rotating border glow */}
      <div className="px-5 mb-3">
        <Link href="/journey" className="block">
          <div className="border-glow">
            <div className="relative z-10 rounded-2xl bg-[#18181b] p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-zinc-50">一键全旅程分析</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">上传报告，自动走完完整诊后旅程</p>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-500/40" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Timeline CTA */}
      <div className="px-5 mb-10">
        <Link href="/timeline" className="block">
          <div className="rounded-2xl bg-[#18181b] border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-zinc-50">主动守护时间线</h3>
                <p className="text-xs text-zinc-400 mt-0.5">看看PostCare如何在28天里主动守护一位患者</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Journey stages — horizontal icons */}
      <div className="px-5 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-bold text-zinc-50 flex-shrink-0">就医旅程</h2>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-5 gap-2">
          {journeyStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link key={stage.href} href={stage.href} className="group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#18181b] border border-white/[0.06] flex items-center justify-center mb-1.5 transition-all duration-300 group-hover:border-indigo-500/40 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Icon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-zinc-50 leading-tight">{stage.title}</span>
                <span className="text-[10px] text-zinc-600 leading-tight">{stage.subtitle}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
          PostCare · 浙大未来学习中心 · Ultra Maker Hackathon 2026
        </p>
      </div>
    </div>
  );
}
