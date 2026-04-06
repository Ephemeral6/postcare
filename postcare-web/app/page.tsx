'use client';

import Link from 'next/link';
import { Heart, Stethoscope, FileText, Pill, TrendingUp, ClipboardList, ChevronRight, Shield, Activity, Sparkles } from 'lucide-react';

const journeyStages = [
  {
    step: 1,
    title: '诊前准备',
    subtitle: '预问诊 · 就诊清单',
    description: '看病前，先让我帮你准备好',
    icon: Stethoscope,
    href: '/pre-visit',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    step: 2,
    title: '报告解读',
    subtitle: '检查报告 · 情绪关怀',
    description: '看不懂报告？我帮你翻译成大白话',
    icon: FileText,
    href: '/report',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    step: 3,
    title: '回家管理',
    subtitle: '用药指导 · 复查提醒 · 生活建议',
    description: '回家后该怎么吃药、怎么生活',
    icon: Pill,
    href: '/medication',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    step: 4,
    title: '健康追踪',
    subtitle: '指标趋势 · 异常预警',
    description: '你的指标是在好转还是恶化',
    icon: TrendingUp,
    href: '/tracking',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    step: 5,
    title: '复诊准备',
    subtitle: '复诊报告 · 医生简报',
    description: '帮你和医生都省时间',
    icon: ClipboardList,
    href: '/revisit',
    gradient: 'from-purple-500 to-purple-600',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-[15%] w-20 h-20 rounded-full bg-white/10 blur-2xl animate-float-slow" />
          <div className="absolute top-16 right-[10%] w-28 h-28 rounded-full bg-white/8 blur-2xl animate-float-slower" />
          <div className="absolute bottom-12 left-[60%] w-16 h-16 rounded-full bg-white/10 blur-xl animate-float-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative px-6 pt-14 pb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg shadow-black/10">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">PostCare</h1>
              <p className="text-sm text-blue-100/90">您的全旅程AI守护者</p>
            </div>
          </div>
          <p className="text-blue-50/80 text-sm leading-relaxed mt-3 max-w-[280px]">
            从诊前准备到复诊跟踪，覆盖完整就医旅程的智能健康助手
          </p>
        </div>

        {/* Wave divider */}
        <svg className="block w-full" viewBox="0 0 1440 48" fill="none">
          <path d="M0 48V18C240 -2 480 30 720 22C960 14 1200 38 1440 22V48H0Z" fill="var(--background)" />
        </svg>
      </div>

      {/* Quick Journey CTA */}
      <div className="px-5 -mt-3 mb-6">
        <Link href="/journey" className="block group">
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-primary via-blue-500 to-indigo-500 p-5 shadow-[0_8px_32px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-0.5">
            {/* Glow orbs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/8 rounded-full -translate-y-12 translate-x-12 blur-sm" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-6 blur-sm" />

            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-0.5">一键全旅程分析</h3>
                <p className="text-xs text-blue-100/80">上传报告，自动走完完整诊后旅程</p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Proactive Guard Timeline CTA */}
      <div className="px-5 mb-6">
        <Link href="/timeline" className="block group">
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 p-5 shadow-[0_8px_32px_rgba(99,102,241,0.2)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.28)] transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/8 rounded-full -translate-y-12 translate-x-12 blur-sm" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-6 blur-sm" />

            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-0.5">主动守护时间线</h3>
                <p className="text-xs text-purple-100/80">看看PostCare如何在28天里主动守护一位患者</p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Journey Timeline */}
      <div className="px-5 pb-6">
        <h2 className="text-lg font-bold text-text mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          就医旅程
        </h2>
        <div className="relative">
          {/* Timeline line - dashed */}
          <div className="absolute left-[23px] top-10 bottom-10 w-px border-l-2 border-dashed border-primary/20" />

          <div className="space-y-3">
            {journeyStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <Link key={stage.step} href={stage.href} className="block group">
                  <div className="card-hover relative flex items-start gap-4 p-4 rounded-[18px] bg-white border border-border/80 shadow-[var(--shadow-soft)]">
                    {/* Step circle */}
                    <div className={`relative z-10 flex-shrink-0 w-[46px] h-[46px] rounded-full bg-gradient-to-br ${stage.gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-text-secondary/70">
                          阶段{stage.step}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-text mb-0.5">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-primary/80 font-medium mb-0.5">
                        {stage.subtitle}
                      </p>
                      <p className="text-xs text-text-secondary/80">
                        {stage.description}
                      </p>
                    </div>

                    <ChevronRight className="flex-shrink-0 w-4 h-4 text-text-secondary/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="px-6 pb-6">
        <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80">
          <p className="text-[11px] text-text-secondary/70 text-center leading-relaxed">
            PostCare 是AI辅助健康管理工具，所有内容仅供参考，不构成医疗建议。
            <br />
            具体诊疗请遵医嘱。
          </p>
        </div>
      </div>
    </div>
  );
}
