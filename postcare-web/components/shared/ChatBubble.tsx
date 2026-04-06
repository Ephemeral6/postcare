import { Heart, Volume2 } from 'lucide-react';
import { textToSpeech } from '@/lib/api';

function PlayButton({ text }: { text: string }) {
  const handlePlay = async () => {
    try { const blob = await textToSpeech(text); const url = URL.createObjectURL(blob); const audio = new Audio(url); audio.play(); audio.onended = () => URL.revokeObjectURL(url); } catch {}
  };
  return (<button onClick={handlePlay} className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#9CA3AF] hover:text-[#2563EB] transition-colors"><Volume2 className="w-3.5 h-3.5" />朗读</button>);
}

export default function ChatBubble({ role, content, showTTS = false }: { role: 'user' | 'assistant'; content: string; showTTS?: boolean }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'bg-[#2563EB] text-white rounded-br-md' : 'bg-white border border-black/[0.06] text-[#374151] rounded-bl-md'}`} style={!isUser ? { boxShadow: 'var(--shadow-card)' } : undefined}>
        <div className="whitespace-pre-wrap">{content}</div>
        {!isUser && showTTS && <PlayButton text={content} />}
      </div>
    </div>
  );
}
