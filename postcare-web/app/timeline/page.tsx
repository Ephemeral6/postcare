'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, Shield } from 'lucide-react';

const typeConfig: Record<string, { label: string; dot: string; border: string }> = {
  report:     { label: '报告解读', dot: 'bg-[#2563EB]',  border: 'border-l-[#2563EB]' },
  medication: { label: '用药提醒', dot: 'bg-[#059669]',  border: 'border-l-[#059669]' },
  lifestyle:  { label: '生活关怀', dot: 'bg-[#059669]',  border: 'border-l-[#059669]' },
  followup:   { label: '复查提醒', dot: 'bg-[#D97706]',  border: 'border-l-[#D97706]' },
  emotion:    { label: '情绪关怀', dot: 'bg-[#7C3AED]',  border: 'border-l-[#7C3AED]' },
  alert:      { label: '紧急提醒', dot: 'bg-[#DC2626]',  border: 'border-l-[#DC2626]' },
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
    <div className="min-h-screen bg-[#FAFAF8] pb-12">
      {/* Header */}
      <div className="bg-[#2563EB] rounded-b-2xl">
        <div className="px-5 pt-12 pb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-white/70 text-sm mb-4 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PostCare 主动守护</h1>
              <p className="text-sm text-white/70">不是等你来找我，而是我主动找你</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-3 mt-4 rounded-xl px-4 py-3 bg-white/10">
            <Shield className="w-5 h-5 text-white/70" />
            <span className="text-sm flex-1 text-white/80">开启主动守护</span>
            <button
              onClick={() => setGuardEnabled(!guardEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${guardEnabled ? 'bg-[#EFF6FF]' : 'bg-white/20'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${guardEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-sm text-[#6B7280] mb-5">
          以下是PostCare在 <span className="font-semibold text-[#1A1A1A]">28天</span> 内主动发送的守护消息
        </p>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-gray-200" />

          <div className="space-y-4">
            {timelineData.map((item, index) => {
              const config = typeConfig[item.type] || typeConfig['report'];
              return (
                <div
                  key={index}
                  className="relative pl-10"
                >
                  {/* Dot */}
                  <div className={`absolute left-[11px] top-5 w-[10px] h-[10px] rounded-full ${config.dot} ring-2 ring-[#FAFAF8] z-10`} />

                  <div
                    className={`bg-white rounded-xl p-4 border-l-4 ${config.border}`}
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-[#6B7280]">
                        {item.date}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF]">
                        · 第<span className="font-data">{item.day}</span>天
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <h3 className="text-[15px] font-bold text-[#1A1A1A]">{item.title}</h3>
                    </div>

                    <p className="text-sm text-[#374151] leading-relaxed">
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
          className="rounded-xl bg-[#F5F5F0] p-6"
        >
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">
            <span className="font-data">{timelineData.length}</span> 次主动守护，覆盖 <span className="font-data">28</span> 天
          </h3>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {summaryItems.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#6B7280]">
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <span className="font-bold font-data text-[#1A1A1A]">{s.count}次</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-[#9CA3AF] italic text-center">
            &ldquo;不是等你来找我，而是我主动找你&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
