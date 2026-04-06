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
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header stage="回家管理" />

      {/* Tab Bar */}
      <div className="sticky top-14 z-40 bg-[#FAFAF8] border-b border-black/[0.06]">
        <div className="flex max-w-lg mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                  isActive ? 'text-[#2563EB]' : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-[#2563EB]" />
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
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">诊断结果</label>
              <input
                type="text"
                value={fDiagnosis}
                onChange={(e) => setFDiagnosis(e.target.value)}
                placeholder="如：肝功能异常，高脂血症"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">异常指标（逗号分隔）</label>
              <textarea
                value={fIndicators}
                onChange={(e) => setFIndicators(e.target.value)}
                placeholder="如：ALT 85 U/L, AST 62 U/L"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFDiagnosis(FOLLOWUP_EXAMPLE.diagnosis);
                  setFIndicators(FOLLOWUP_EXAMPLE.indicators);
                }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-black/[0.06] text-sm text-[#6B7280] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                试试示例
              </button>
              <button
                onClick={handleFollowup}
                disabled={fLoading || !fDiagnosis.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
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
              <div className="relative overflow-hidden rounded-xl bg-[#2563EB] p-5 text-white">
                <div className="absolute top-3 right-3 opacity-10">
                  <CalendarDays className="w-20 h-20" />
                </div>
                <p className="text-sm text-blue-100 mb-1">下次复查日期</p>
                <p className="text-3xl font-bold tracking-tight">{fResult.next_checkup?.recommended_date}</p>
              </div>

              {/* Check Items */}
              {(fResult.checkup_items ?? []).length > 0 && (
                <div className="rounded-2xl bg-white border border-black/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardCheck className="w-4.5 h-4.5 text-[#2563EB]" />
                    <h3 className="text-sm font-bold text-[#1A1A1A]">复查项目</h3>
                  </div>
                  <div className="space-y-2">
                    {fResult.checkup_items?.map((ci, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F5F5F0] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.has(idx)}
                          onChange={() => toggleCheck(idx)}
                          className="mt-0.5 w-4 h-4 rounded border-black/[0.06] text-[#2563EB] focus:ring-blue-100 accent-[#2563EB]"
                        />
                        <div className={`text-sm leading-relaxed ${
                            checkedItems.has(idx) ? 'line-through text-[#6B7280]' : 'text-[#1A1A1A]'
                          }`}>
                          <span>{ci.item}</span>
                          {ci.reason && <span className="text-[#6B7280] ml-1">({ci.reason})</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Preparations */}
              {(fResult.preparation ?? []).length > 0 && (
                <div className="rounded-2xl bg-white border border-black/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="w-4.5 h-4.5 text-[#059669]" />
                    <h3 className="text-sm font-bold text-[#1A1A1A]">准备事项</h3>
                  </div>
                  <div className="space-y-2">
                    {fResult.preparation?.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-[#ECFDF5]"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#059669] flex-shrink-0" />
                        <span className="text-sm text-[#1A1A1A] leading-relaxed">
                          {p.instruction}
                          {p.time_before && <span className="text-[#6B7280] ml-1">（提前{p.time_before}）</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Signals */}
              {(fResult.emergency_signs ?? []).length > 0 && (
                <div className="rounded-xl bg-[#FEF2F2] border border-red-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4.5 h-4.5 text-[#DC2626]" />
                    <h3 className="text-sm font-bold text-[#DC2626]">紧急信号</h3>
                  </div>
                  <p className="text-xs text-[#DC2626]/70 mb-2">出现以下情况请立即就医：</p>
                  <div className="space-y-2">
                    {fResult.emergency_signs?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F5F0] border border-red-200"
                      >
                        <AlertTriangle className="mt-0.5 w-3.5 h-3.5 text-[#DC2626] flex-shrink-0" />
                        <span className="text-sm text-[#DC2626] font-medium leading-relaxed">{item}</span>
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
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">诊断结果</label>
              <input
                type="text"
                value={lDiagnosis}
                onChange={(e) => setLDiagnosis(e.target.value)}
                placeholder="如：肝功能异常，高脂血症"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">异常指标（逗号分隔）</label>
              <textarea
                value={lIndicators}
                onChange={(e) => setLIndicators(e.target.value)}
                placeholder="如：ALT 85 U/L, AST 62 U/L"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">当前用药（逗号分隔）</label>
              <textarea
                value={lMedications}
                onChange={(e) => setLMedications(e.target.value)}
                placeholder="如：阿托伐他汀钙片 20mg, 双环醇片 25mg"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/[0.06] text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLDiagnosis(LIFESTYLE_EXAMPLE.diagnosis);
                  setLIndicators(LIFESTYLE_EXAMPLE.indicators);
                  setLMedications(LIFESTYLE_EXAMPLE.medications);
                }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-black/[0.06] text-sm text-[#6B7280] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                试试示例
              </button>
              <button
                onClick={handleLifestyle}
                disabled={lLoading || !lDiagnosis.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
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
                  <h3 className="text-sm font-bold text-[#1A1A1A]">饮食建议</h3>
                </div>
                {(lResult.diet?.should_eat ?? []).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-[#059669] mb-2">推荐食用</p>
                    <div className="flex flex-wrap gap-2">
                      {lResult.diet.should_eat.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#059669] text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(lResult.diet?.should_avoid ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#DC2626] mb-2">建议避免</p>
                    <div className="flex flex-wrap gap-2">
                      {lResult.diet.should_avoid.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-sm font-medium"
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
                    <h3 className="text-sm font-bold text-[#1A1A1A]">运动建议</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 p-4">
                      {lResult.exercise.recommended && (
                        <div className="flex items-center gap-2 mb-2">
                          <Dumbbell className="w-4 h-4 text-[#2563EB]" />
                          <span className="text-sm font-bold text-[#2563EB]">{lResult.exercise.recommended}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#2563EB]">
                        {lResult.exercise.frequency && (
                          <div>
                            <span className="text-[#2563EB]/70">频率：</span>
                            {lResult.exercise.frequency}
                          </div>
                        )}
                        {lResult.exercise.avoid && (
                          <div>
                            <span className="text-[#2563EB]/70">避免：</span>
                            {lResult.exercise.avoid}
                          </div>
                        )}
                      </div>
                      {lResult.exercise.tip && (
                        <p className="mt-2 text-xs text-[#2563EB]/80 leading-relaxed">{lResult.exercise.tip}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Habits Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">😴</span>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">生活习惯</h3>
                </div>
                {lResult.habits.must_do.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-purple-600 mb-2">建议养成</p>
                    <div className="space-y-2">
                      {lResult.habits.must_do.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200"
                        >
                          <Moon className="mt-0.5 w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span className="text-sm text-purple-600 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lResult.habits.avoid.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#6B7280] mb-2">建议避免</p>
                    <div className="space-y-2">
                      {lResult.habits.avoid.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F5F0] border border-black/[0.06]"
                        >
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#9CA3AF] flex-shrink-0" />
                          <span className="text-sm text-[#6B7280] leading-relaxed">{item}</span>
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
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 bg-white border border-black/[0.06]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Disclaimer + Chat Input */}
          <div className="border-t border-black/[0.06]">
            <div className="py-1.5 px-4 bg-[#F5F5F0]">
              <p className="text-center text-[11px] text-[#6B7280]">
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
