'use client';

import Link from 'next/link';
import { Heart, Stethoscope, FileText, Pill, TrendingUp, ClipboardList, ChevronRight, Activity } from 'lucide-react';

const journeyStages = [
  {
    title: '诊前准备',
    subtitle: '预问诊·就诊清单',
    icon: Stethoscope,
    href: '/pre-visit',
  },
  {
    title: '报告解读',
    subtitle: '检查报告·情绪关怀',
    icon: FileText,
    href: '/report',
  },
  {
    title: '回家管理',
    subtitle: '用药·复查·生活',
    icon: Pill,
    href: '/medication',
  },
  {
    title: '健康追踪',
    subtitle: '趋势·预警',
    icon: TrendingUp,
    href: '/tracking',
  },
  {
    title: '复诊准备',
    subtitle: '报告·简报',
    icon: ClipboardList,
    href: '/revisit',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] pb-20">
      {/* Header / Hero */}
      <div className="px-6 pt-12 pb-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Heart className="w-4 h-4 text-indigo-400 fill-indigo-400" />
          </div>
          <span className="text-[15px] font-semibold text-zinc-50 tracking-tight">PostCare</span>
        </div>

        {/* Hero text */}
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight leading-snug mb-3">
          让医生在诊室里来不及说的话，<br />在你最需要的时候被听见。
        </h1>
        <p className="text-sm text-zinc-400">
          覆盖诊前→诊后→回家→追踪→复诊的完整旅程
        </p>
      </div>

      {/* Journey CTA */}
      <div className="px-5 mb-3">
        <Link href="/journey" className="block">
          <div
            className="rounded-2xl bg-[#18181b] p-5"
            style={{
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 8px 40px -12px rgba(99,102,241,0.15)',
            }}
          >
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
        </Link>
      </div>

      {/* Timeline CTA */}
      <div className="px-5 mb-10">
        <Link href="/timeline" className="block">
          <div className="rounded-2xl bg-[#18181b] border border-white/[0.06] p-5">
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

      {/* Section: Journey stages */}
      <div className="px-5 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-bold text-zinc-50">就医旅程</h2>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <div className="flex justify-between">
          {journeyStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link key={stage.href} href={stage.href} className="group flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#18181b] border border-white/[0.06] flex items-center justify-center mb-2 transition-colors group-hover:border-indigo-500/30">
                  <Icon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-xs font-medium text-zinc-50 leading-tight">{stage.title}</span>
                <span className="text-[10px] text-zinc-600 leading-tight mt-0.5">{stage.subtitle}</span>
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
