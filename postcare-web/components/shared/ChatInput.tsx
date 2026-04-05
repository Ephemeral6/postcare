'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = '输入你的问题...',
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-t border-border">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 border border-border text-sm text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
