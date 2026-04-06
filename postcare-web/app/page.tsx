'use client';

import Link from 'next/link';
import { Heart, Stethoscope, FileText, Pill, TrendingUp, ClipboardList, ChevronRight, Shield, Activity } from 'lucide-react';

const journeyStages = [
  {
    step: 1,
    title: '诊前准备',
    subtitle: '预问诊 · 就诊清单',
    description: '看病前，先让我帮你准备好',
    icon: Stethoscope,
    href: '/pre-visit',
  },
  {
    step: 2,
    title: '报告解读',
    subtitle: '检查报告 · 情绪关怀',
    description: '看不懂报告？我帮你翻译成大白话',
    icon: FileText,
    href: '/report',
  },
  {
    step: 3,
    title: '回家管理',
    subtitle: '用药指导 · 复查提醒 · 生活建议',
    description: '回家后该怎么吃药、怎么生活',
    icon: Pill,
    href: '/medication',
  },
  {
    step: 4,
    title: '健康追踪',
    subtitle: '指标趋势 · 异常预警',
    description: '你的指标是在好转还是恶化',
    icon: TrendingUp,
    href: '/tracking',
  },
  {
    step: 5,
    title: '复诊准备',
    subtitle: '复诊报告 · 医生简报',
    description: '帮你和医生都省时间',
    icon: ClipboardList,
    href: '/revisit',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B1120] pb-20">
      {/* Hero */}
      <div className="relative px-6 pt-12 pb-10">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">PostCare</h1>
              <p className="text-sm text-[#94A3B8]">您的全旅程AI守护者</p>
            </div>
          </div>

          <p className="text-xl text-slate-300 tracking-wide leading-relaxed">
            让医生在诊室里来不及说的话，在你最需要的时候被听见。
          </p>
        </div>
      </div>

      {/* Journey CTA */}
      <div className="px-5 mb-4">
        <Link href="/journey" className="block">
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))',
              border: '1px solid rgba(59,130,246,0.2)',
              boxShadow: '0 0 30px rgba(59,130,246,0.08)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#F1F5F9]">一键全旅程分析</h3>
                <p className="text-xs text-[#94A3B8]">上传报告，自动走完完整诊后旅程</p>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-500/40" />
            </div>
          </div>
        </Link>
      </div>

      {/* Timeline CTA */}
      <div className="px-5 mb-6">
        <Link href="/timeline" className="block">
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))',
              border: '1px solid rgba(139,92,246,0.15)',
              boxShadow: '0 0 30px rgba(139,92,246,0.06)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#F1F5F9]">主动守护时间线</h3>
                <p className="text-xs text-[#94A3B8]">看看PostCare如何在28天里主动守护一位患者</p>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-500/40" />
            </div>
          </div>
        </Link>
      </div>

      {/* Journey Timeline */}
      <div className="px-5 pb-6">
        <h2 className="text-lg font-bold text-[#F1F5F9] mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          就医旅程
        </h2>
        <div className="relative">
          {/* Timeline line - gradient */}
          <div className="absolute left-[23px] top-10 bottom-10 w-px bg-gradient-to-b from-blue-500 to-transparent" />

          <div className="space-y-3">
            {journeyStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <Link key={stage.step} href={stage.href} className="block group">
                  <div
                    className="relative flex items-start gap-4 p-4 rounded-xl bg-[#141E33] border border-white/5"
                    style={{ boxShadow: '0 0 20px rgba(59,130,246,0.05)' }}
                  >
                    {/* Step circle */}
                    <div className="relative z-10 flex-shrink-0 w-[46px] h-[46px] rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-[#94A3B8]">
                          阶段{stage.step}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-[#F1F5F9] mb-0.5">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-blue-400 font-medium mb-0.5">
                        {stage.subtitle}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {stage.description}
                      </p>
                    </div>

                    <ChevronRight className="flex-shrink-0 w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors mt-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          PostCare · 浙大未来学习中心 · Ultra Maker Hackathon 2026
        </p>
      </div>
    </div>
  );
}
