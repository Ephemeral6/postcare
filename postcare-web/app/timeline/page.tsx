'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, Shield } from 'lucide-react';

const typeConfig: Record<string, { label: string; dot: string; glow: string }> = {
  report:     { label: '报告解读', dot: 'bg-blue-500',    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.4)]' },
  medication: { label: '用药提醒', dot: 'bg-green-500',   glow: 'shadow-[0_0_8px_rgba(34,197,94,0.4)]' },
  lifestyle:  { label: '生活关怀', dot: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]' },
  followup:   { label: '复查提醒', dot: 'bg-amber-500',   glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]' },
  emotion:    { label: '情绪关怀', dot: 'bg-purple-500',  glow: 'shadow-[0_0_8px_rgba(168,85,247,0.4)]' },
  alert:      { label: '紧急提醒', dot: 'bg-red-500',     glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
};

const timelineData = [
  {
    day: 0,
    date: '3月20日',
    title: '检查日',
    type: 'report',
    icon: '\u{1F4CB}',
    message: '您的检查报告已解读完成。ALT 85 U/L（偏高），建议4周后复查肝功能。',
  },
  {
    day: 1,
    date: '3月21日',
    title: '用药提醒',
    type: 'medication',
    icon: '\u{1F48A}',
    message: '护肝片服用第1天。记得饭后服用，每日3次。如果出现腹泻或皮疹，及时告诉我。',
  },
  {
    day: 3,
    date: '3月23日',
    title: '生活关怀',
    type: 'lifestyle',
    icon: '\u{1F957}',
    message: '提醒您：肝功能恢复期间请避免饮酒，少吃油腻食物。今天试试清蒸鱼配西兰花怎么样？',
  },
  {
    day: 7,
    date: '3月27日',
    title: '一周小结',
    type: 'report',
    icon: '\u{1F4CA}',
    message: '用药已满1周。如果这周没有明显不适，说明耐受性不错。继续坚持，下周会更好。',
  },
  {
    day: 10,
    date: '3月30日',
    title: '情绪关怀',
    type: 'emotion',
    icon: '\u{1F499}',
    message: '距离复查还有18天。不要焦虑，大部分药物性肝损伤经过治疗后都能恢复。有任何疑问随时问我。',
  },
  {
    day: 14,
    date: '4月3日',
    title: '半程提醒',
    type: 'followup',
    icon: '\u{1F4C5}',
    message: '治疗已过半。距离复查还有2周，记得提前预约挂号（消化内科或肝病科）。需要我帮你生成预约清单吗？',
  },
  {
    day: 21,
    date: '4月10日',
    title: '复查预警',
    type: 'followup',
    icon: '\u23F0',
    message: '下周就要复查了！需要空腹12小时，建议预约上午的号。复查项目：肝功能全套+腹部B超。我已帮你生成复查清单。',
  },
  {
    day: 25,
    date: '4月14日',
    title: '复查前准备',
    type: 'alert',
    icon: '\u26A0\uFE0F',
    message: '后天复查！今晚10点后请勿进食。明天避免剧烈运动。记得带上上次的检查报告（3月20日），方便医生对比。',
  },
  {
    day: 27,
    date: '4月16日',
    title: '复查日',
    type: 'followup',
    icon: '\u{1F3E5}',
    message: '今天复查日。检查完后上传新报告，我帮你自动对比上次结果，看看治疗效果怎么样。祝一切顺利！',
  },
  {
    day: 28,
    date: '4月17日',
    title: '好消息！',
    type: 'report',
    icon: '\u{1F389}',
    message: '复查结果出来了！ALT从85降到45 U/L，好转了47%。护肝片效果不错，当前治疗方案有效。继续坚持，下次3个月后复查。',
  },
];

const typeCounts: Record<string, number> = {};
timelineData.forEach((item) => {
  typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
});

const summaryItems = [
  { icon: '\u{1F4CB}', label: '报告解读', count: typeCounts['report'] || 0 },
  { icon: '\u{1F48A}', label: '用药提醒', count: typeCounts['medication'] || 0 },
  { icon: '\u{1F957}', label: '生活关怀', count: typeCounts['lifestyle'] || 0 },
  { icon: '\u{1F499}', label: '情绪关怀', count: typeCounts['emotion'] || 0 },
  { icon: '\u{1F4C5}', label: '复查提醒', count: typeCounts['followup'] || 0 },
  { icon: '\u26A0\uFE0F', label: '紧急提醒', count: typeCounts['alert'] || 0 },
];

export default function TimelinePage() {
  const [guardEnabled, setGuardEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-[#0B1120] pb-12">
      {/* Header */}
      <div className="bg-[#141E33]">
        <div className="px-5 pt-12 pb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-400/70 text-sm mb-4 hover:text-blue-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
              <Heart className="w-6 h-6 text-blue-400 fill-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">PostCare 主动守护</h1>
              <p className="text-sm text-[#94A3B8]">不是等你来找我，而是我主动找你</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-3 mt-4 rounded-xl px-4 py-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <Shield className="w-5 h-5 text-blue-400/70" />
            <span className="text-sm flex-1 text-[#94A3B8]">开启主动守护</span>
            <button
              onClick={() => setGuardEnabled(!guardEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${guardEnabled ? 'bg-blue-600/40' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${guardEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-sm text-[#94A3B8] mb-5">
          以下是PostCare在 <span className="font-semibold text-[#F1F5F9]">28天</span> 内主动发送的守护消息
        </p>

        <div className="relative">
          {/* Glowing blue vertical line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/60 to-blue-500/0" />

          <div className="space-y-4">
            {timelineData.map((item, index) => {
              const config = typeConfig[item.type] || typeConfig['report'];
              return (
                <div
                  key={index}
                  className="relative pl-10"
                >
                  {/* Dot with glow */}
                  <div className={`absolute left-[9px] top-5 w-[14px] h-[14px] rounded-full ${config.dot} ${config.glow} ring-2 ring-[#0B1120] z-10`} />

                  <div className="bg-[#141E33] rounded-xl p-4 border border-white/5" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.05)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-[#94A3B8]">
                        {item.date}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        · 第{item.day}天
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <h3 className="text-[15px] font-bold text-[#F1F5F9]">{item.title}</h3>
                    </div>

                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-5 pt-2 pb-6">
        <div
          className="rounded-xl bg-[#141E33] p-6"
          style={{
            border: '1px solid rgba(59,130,246,0.15)',
            boxShadow: '0 0 30px rgba(59,130,246,0.08)',
          }}
        >
          <h3 className="text-lg font-bold text-[#F1F5F9] mb-4">
            28天，PostCare主动触达了{timelineData.length}次
          </h3>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {summaryItems.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <span className="font-bold font-data text-[#F1F5F9]">{s.count}次</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-600 italic text-center">
            &ldquo;不是等你来找我，而是我主动找你&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
