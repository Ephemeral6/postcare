'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  AlertTriangle,
  Sparkles,
  Utensils,
  Dumbbell,
  Moon,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DisclaimerBar from '@/components/shared/DisclaimerBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ChatBubble from '@/components/shared/ChatBubble';
import ChatInput from '@/components/shared/ChatInput';
import { generateFollowup, lifestyleAdvice, chat } from '@/lib/api';
import type { FollowupResult, LifestyleResult, ChatMessage } from '@/lib/types';

type Tab = 'followup' | 'lifestyle' | 'chat';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'followup', label: '复查提醒', icon: CalendarDays },
  { key: 'lifestyle', label: '生活建议', icon: Utensils },
  { key: 'chat', label: '问问AI', icon: MessageCircle },
];

const FOLLOWUP_EXAMPLE = {
  diagnosis: '肝功能异常，高脂血症',
  indicators: 'ALT 85 U/L, AST 62 U/L, TC 6.8 mmol/L',
};

const LIFESTYLE_EXAMPLE = {
  diagnosis: '肝功能异常，高脂血症',
  indicators: 'ALT 85 U/L, AST 62 U/L, TC 6.8 mmol/L',
  medications: '阿托伐他汀钙片 20mg, 双环醇片 25mg',
};

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('followup');

  // --- Tab 1: Followup ---
  const [fDiagnosis, setFDiagnosis] = useState('');
  const [fIndicators, setFIndicators] = useState('');
  const [fLoading, setFLoading] = useState(false);
  const [fResult, setFResult] = useState<FollowupResult | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // --- Tab 2: Lifestyle ---
  const [lDiagnosis, setLDiagnosis] = useState('');
  const [lIndicators, setLIndicators] = useState('');
  const [lMedications, setLMedications] = useState('');
  const [lLoading, setLLoading] = useState(false);
  const [lResult, setLResult] = useState<LifestyleResult | null>(null);

  // --- Tab 3: Chat ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好！我是PostCare健康助手，有什么健康问题都可以问我。' },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---
  const handleFollowup = async () => {
    if (!fDiagnosis.trim()) return;
    setFLoading(true);
    setFResult(null);
    setCheckedItems(new Set());
    try {
      const indicators = fIndicators
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await generateFollowup(fDiagnosis.trim(), indicators);
      setFResult(result as FollowupResult);
    } catch {
      // error handled silently
    } finally {
      setFLoading(false);
    }
  };

  const handleLifestyle = async () => {
    if (!lDiagnosis.trim()) return;
    setLLoading(true);
    setLResult(null);
    try {
      const indicators = lIndicators
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const medications = lMedications
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await lifestyleAdvice(lDiagnosis.trim(), indicators, medications);
      setLResult(result as LifestyleResult);
    } catch {
      // error handled silently
    } finally {
      setLLoading(false);
    }
  };

  const handleChat = async (message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatLoading(true);
    try {
      const history = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const result = await chat(message, null, history);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: result.reply || result.content || result.message || '抱歉，我暂时无法回答这个问题。',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '网络异常，请稍后再试。' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#09090b]">
      <Header stage="回家管理" />

      {/* Tab Bar */}
      <div className="sticky top-14 z-40 bg-[#09090b] border-b border-white/[0.06]">
        <div className="flex max-w-lg mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                  isActive ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'followup' && (
        <div className="max-w-lg mx-auto px-4 pt-5 pb-20 page-enter">
          {/* Input section */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-50 mb-1.5">诊断结果</label>
              <input
                type="text"
                value={fDiagnosis}
                onChange={(e) => setFDiagnosis(e.target.value)}
                placeholder="如：肝功能异常，高脂血症"
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.06] text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-50 mb-1.5">异常指标（逗号分隔）</label>
              <textarea
                value={fIndicators}
                onChange={(e) => setFIndicators(e.target.value)}
                placeholder="如：ALT 85 U/L, AST 62 U/L"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.06] text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFDiagnosis(FOLLOWUP_EXAMPLE.diagnosis);
                  setFIndicators(FOLLOWUP_EXAMPLE.indicators);
                }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-white/[0.06] text-sm text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                试试示例
              </button>
              <button
                onClick={handleFollowup}
                disabled={fLoading || !fDiagnosis.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <CalendarDays className="w-4 h-4" />
                生成提醒
              </button>
            </div>
          </div>

          {fLoading && <LoadingSpinner text="正在生成复查提醒..." />}

          {fResult && (
            <div className="mt-6 space-y-4">
              {/* Calendar Card */}
              <div className="relative overflow-hidden rounded-xl bg-indigo-500 p-5 text-white">
                <div className="absolute top-3 right-3 opacity-10">
                  <CalendarDays className="w-20 h-20" />
                </div>
                <p className="text-sm text-indigo-100 mb-1">下次复查日期</p>
                <p className="text-3xl font-bold tracking-tight">{fResult.next_checkup?.recommended_date}</p>
              </div>

              {/* Check Items */}
              {(fResult.checkup_items ?? []).length > 0 && (
                <div className="rounded-2xl bg-[#18181b] border border-white/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardCheck className="w-4.5 h-4.5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-zinc-50">复查项目</h3>
                  </div>
                  <div className="space-y-2">
                    {fResult.checkup_items?.map((ci, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#27272a] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.has(idx)}
                          onChange={() => toggleCheck(idx)}
                          className="mt-0.5 w-4 h-4 rounded border-white/[0.06] text-indigo-500 focus:ring-indigo-500/10 accent-indigo-500"
                        />
                        <div className={`text-sm leading-relaxed ${
                            checkedItems.has(idx) ? 'line-through text-zinc-400' : 'text-zinc-50'
                          }`}>
                          <span>{ci.item}</span>
                          {ci.reason && <span className="text-zinc-400 ml-1">({ci.reason})</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Preparations */}
              {(fResult.preparation ?? []).length > 0 && (
                <div className="rounded-2xl bg-[#18181b] border border-white/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="w-4.5 h-4.5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-zinc-50">准备事项</h3>
                  </div>
                  <div className="space-y-2">
                    {fResult.preparation?.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-400/10"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-50 leading-relaxed">
                          {p.instruction}
                          {p.time_before && <span className="text-zinc-400 ml-1">（提前{p.time_before}）</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Signals */}
              {(fResult.emergency_signs ?? []).length > 0 && (
                <div className="rounded-xl bg-red-400/10 border border-red-400/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
                    <h3 className="text-sm font-bold text-red-400">紧急信号</h3>
                  </div>
                  <p className="text-xs text-red-400/70 mb-2">出现以下情况请立即就医：</p>
                  <div className="space-y-2">
                    {fResult.emergency_signs?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-[#27272a] border border-red-400/10"
                      >
                        <AlertTriangle className="mt-0.5 w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-400 font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lifestyle' && (
        <div className="max-w-lg mx-auto px-4 pt-5 pb-20 page-enter">
          {/* Input section */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-50 mb-1.5">诊断结果</label>
              <input
                type="text"
                value={lDiagnosis}
                onChange={(e) => setLDiagnosis(e.target.value)}
                placeholder="如：肝功能异常，高脂血症"
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.06] text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-50 mb-1.5">异常指标（逗号分隔）</label>
              <textarea
                value={lIndicators}
                onChange={(e) => setLIndicators(e.target.value)}
                placeholder="如：ALT 85 U/L, AST 62 U/L"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.06] text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-50 mb-1.5">当前用药（逗号分隔）</label>
              <textarea
                value={lMedications}
                onChange={(e) => setLMedications(e.target.value)}
                placeholder="如：阿托伐他汀钙片 20mg, 双环醇片 25mg"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.06] text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLDiagnosis(LIFESTYLE_EXAMPLE.diagnosis);
                  setLIndicators(LIFESTYLE_EXAMPLE.indicators);
                  setLMedications(LIFESTYLE_EXAMPLE.medications);
                }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-white/[0.06] text-sm text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                试试示例
              </button>
              <button
                onClick={handleLifestyle}
                disabled={lLoading || !lDiagnosis.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                获取建议
              </button>
            </div>
          </div>

          {lLoading && <LoadingSpinner text="正在生成生活建议..." />}

          {lResult && (
            <div className="mt-6 space-y-5">
              {/* Diet Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🥗</span>
                  <h3 className="text-sm font-bold text-zinc-50">饮食建议</h3>
                </div>
                {(lResult.diet?.should_eat ?? []).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-emerald-400 mb-2">推荐食用</p>
                    <div className="flex flex-wrap gap-2">
                      {lResult.diet.should_eat.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(lResult.diet?.should_avoid ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-2">建议避免</p>
                    <div className="flex flex-wrap gap-2">
                      {lResult.diet.should_avoid.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1.5 rounded-full bg-red-400/10 text-red-400 text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Exercise Section */}
              {lResult.exercise && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🏃</span>
                    <h3 className="text-sm font-bold text-zinc-50">运动建议</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4">
                      {lResult.exercise.recommended && (
                        <div className="flex items-center gap-2 mb-2">
                          <Dumbbell className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-bold text-indigo-400">{lResult.exercise.recommended}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-indigo-400">
                        {lResult.exercise.frequency && (
                          <div>
                            <span className="text-indigo-400/70">频率：</span>
                            {lResult.exercise.frequency}
                          </div>
                        )}
                        {lResult.exercise.avoid && (
                          <div>
                            <span className="text-indigo-400/70">避免：</span>
                            {lResult.exercise.avoid}
                          </div>
                        )}
                      </div>
                      {lResult.exercise.tip && (
                        <p className="mt-2 text-xs text-indigo-400/80 leading-relaxed">{lResult.exercise.tip}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Habits Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">😴</span>
                  <h3 className="text-sm font-bold text-zinc-50">生活习惯</h3>
                </div>
                {lResult.habits.must_do.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-purple-400 mb-2">建议养成</p>
                    <div className="space-y-2">
                      {lResult.habits.must_do.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-400/10 border border-purple-400/20"
                        >
                          <Moon className="mt-0.5 w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span className="text-sm text-purple-400 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lResult.habits.avoid.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-2">建议避免</p>
                    <div className="space-y-2">
                      {lResult.habits.avoid.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-[#27272a] border border-white/[0.06]"
                        >
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                          <span className="text-sm text-zinc-400 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="max-w-lg mx-auto flex flex-col" style={{ height: 'calc(100vh - 56px - 45px)' }}>
          {/* Chat messages area */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                role={msg.role}
                content={msg.content}
                showTTS={msg.role === 'assistant'}
              />
            ))}
            {chatLoading && (
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 bg-[#18181b] border border-white/[0.06]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Disclaimer + Chat Input */}
          <div className="border-t border-white/[0.06]">
            <div className="py-1.5 px-4 bg-[#27272a]">
              <p className="text-center text-[11px] text-zinc-400">
                以上内容由AI生成，仅供参考，不替代医生诊断
              </p>
            </div>
            <ChatInput onSend={handleChat} disabled={chatLoading} placeholder="输入你的健康问题..." />
          </div>

          {/* Bottom nav spacer */}
          <div className="h-16" />
        </div>
      )}

      {activeTab !== 'chat' && <DisclaimerBar />}
      <BottomNav />
    </div>
  );
}
