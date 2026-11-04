'use client';

import { Bot, MessageCircle, Sparkles, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/components/ui';
import ChatbotPanel from './ChatbotPanel';

export default function ChatbotWidget() {
  const { ready, open, toggleChat, ui } = useChatbot();

  if (!ready) return null;

  return (
    <>
      {open ? <ChatbotPanel /> : null}

      <button
        type="button"
        data-tour="chatbot-toggle"
        onClick={toggleChat}
        aria-label={open ? ui.close : 'Open StockSense AI Assistant'}
        aria-expanded={open}
        title={open ? ui.close : 'Ask the StockSense AI Assistant'}
        className={cn(
          'group fixed bottom-5 right-4 z-[85] inline-flex items-center gap-2 rounded-full px-3.5 py-3 text-white shadow-xl ring-1 ring-brand-400/40 transition hover:-translate-y-0.5 sm:right-5',
          open ? 'bg-slate-800 hover:bg-slate-900' : 'bg-brand-600 hover:bg-brand-700'
        )}
      >
        <span className="relative grid h-5 w-5 place-items-center">
          {open ? <X size={19} /> : <Bot size={19} />}
        </span>
        <span className="hidden text-[12px] font-bold sm:inline">
          {open ? 'Close assistant' : 'Ask StockSense AI'}
        </span>
        {!open ? (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        ) : null}
      </button>
    </>
  );
}
