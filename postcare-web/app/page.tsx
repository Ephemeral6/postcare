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
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  // Render hero text with last two chars "听见" in blue
  const renderHeroText = () => {
    const fullLen = HERO_TEXT.length;
    const highlightStart = fullLen - 3; // "听见。" starts at index fullLen-3, but we want "听见" = index fullLen-3 and fullLen-2
    // "听见" are the 2 chars before the final "。"
    // HERO_TEXT = '让医生在诊室里来不及说的话，在你最需要的时候被听见。'
    // "听" is at index 22, "见" at 23, "。" at 24 (length 25)
    const hearStart = HERO_TEXT.indexOf('听见');
    if (typed.length <= hearStart) {
      return <>{typed}</>;
    }
    const before = typed.slice(0, hearStart);
    const highlight = typed.slice(hearStart, hearStart + 2);
    const after = typed.slice(hearStart + 2);
    return (
      <>
        {before}
        <span className="text-[#2563EB]">{highlight}</span>
        {after}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-20">
      {/* Header / Hero */}
      <div className="px-6 pt-12 pb-10">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#1A1A1A] tracking-tight">PostCare</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight leading-snug mb-3 min-h-[4.5em]">
          {renderHeroText()}
          {showCursor && <span className="cursor-blink text-[#2563EB] ml-0.5">|</span>}
        </h1>
        <p className="text-sm text-[#6B7280]">
          覆盖诊前→诊后→回家→追踪→复诊的完整旅程
        </p>
      </div>

      {/* Journey CTA — blue card */}
      <div className="px-5 mb-3">
        <Link href="/journey" className="block">
          <div
            className="rounded-2xl bg-[#2563EB] text-white p-5"
            style={{ boxShadow: '0 8px 24px rgba(37,99,235,0.25)' }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-white">一键全旅程分析</h3>
                <p className="text-xs text-white/70 mt-0.5">上传报告，自动走完完整诊后旅程</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </div>
          </div>
        </Link>
      </div>

      {/* Timeline CTA — white card with blue left border */}
      <div className="px-5 mb-10">
        <Link href="/timeline" className="block">
          <div
            className="rounded-2xl bg-white border-l-4 border-l-[#2563EB] p-5"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                <Heart className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">主动守护时间线</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">看看PostCare如何在28天里主动守护一位患者</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
            </div>
          </div>
        </Link>
      </div>

      {/* Journey stages — horizontal icons */}
      <div className="px-5 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-bold text-[#1A1A1A] flex-shrink-0">就医旅程</h2>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="grid grid-cols-5 gap-2">
          {journeyStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link key={stage.href} href={stage.href} className="group flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-1.5 transition-all duration-300 group-hover:transform group-hover:-translate-y-0.5"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
                >
                  <Icon className="w-5 h-5 text-[#6B7280] group-hover:text-[#2563EB] transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-[#1A1A1A] leading-tight">{stage.title}</span>
                <span className="text-[10px] text-[#9CA3AF] leading-tight">{stage.subtitle}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed">
          PostCare · 浙大未来学习中心 · Ultra Maker Hackathon 2026
        </p>
      </div>
    </div>
  );
}
