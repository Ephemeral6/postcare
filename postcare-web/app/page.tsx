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
    color: 'bg-blue-600',
  },
  {
    step: 2,
    title: '报告解读',
    subtitle: '检查报告 · 情绪关怀',
    description: '看不懂报告？我帮你翻译成大白话',
    icon: FileText,
    href: '/report',
    color: 'bg-blue-500',
  },
  {
    step: 3,
    title: '回家管理',
    subtitle: '用药指导 · 复查提醒 · 生活建议',
    description: '回家后该怎么吃药、怎么生活',
    icon: Pill,
    href: '/medication',
    color: 'bg-green-600',
  },
  {
    step: 4,
    title: '健康追踪',
    subtitle: '指标趋势 · 异常预警',
    description: '你的指标是在好转还是恶化',
    icon: TrendingUp,
    href: '/tracking',
    color: 'bg-amber-500',
  },
  {
    step: 5,
    title: '复诊准备',
    subtitle: '复诊报告 · 医生简报',
    description: '帮你和医生都省时间',
    icon: ClipboardList,
    href: '/revisit',
    color: 'bg-purple-600',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PostCare</h1>
            <p className="text-sm text-gray-500">您的全旅程AI守护者</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          从诊前准备到复诊跟踪，覆盖完整就医旅程的智能健康助手
        </p>
      </div>

      {/* Quick Journey CTA */}
      <div className="px-5 mb-4">
        <Link href="/journey" className="block">
          <div className="rounded-2xl bg-blue-600 p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">一键全旅程分析</h3>
                <p className="text-xs text-blue-100">上传报告，自动走完完整诊后旅程</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </Link>
      </div>

      {/* Proactive Guard Timeline CTA */}
      <div className="px-5 mb-6">
        <Link href="/timeline" className="block">
          <div className="rounded-2xl bg-white border-2 border-blue-100 p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">主动守护时间线</h3>
                <p className="text-xs text-gray-500">看看PostCare如何在28天里主动守护一位患者</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </Link>
      </div>

      {/* Journey Timeline */}
      <div className="px-5 pb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          就医旅程
        </h2>
        <div className="relative">
          {/* Timeline line - dashed */}
          <div className="absolute left-[23px] top-10 bottom-10 w-px border-l-2 border-dashed border-blue-100" />

          <div className="space-y-3">
            {journeyStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <Link key={stage.step} href={stage.href} className="block group">
                  <div className="relative flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100">
                    {/* Step circle */}
                    <div className={`relative z-10 flex-shrink-0 w-[46px] h-[46px] rounded-full ${stage.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-gray-400">
                          阶段{stage.step}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900 mb-0.5">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium mb-0.5">
                        {stage.subtitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stage.description}
                      </p>
                    </div>

                    <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors mt-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="px-6 pb-6">
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            PostCare 是AI辅助健康管理工具，所有内容仅供参考，不构成医疗建议。
            <br />
            具体诊疗请遵医嘱。
          </p>
        </div>
      </div>
    </div>
  );
}
