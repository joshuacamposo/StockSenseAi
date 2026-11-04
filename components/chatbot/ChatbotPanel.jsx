'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  Check,
  ChevronRight,
  Compass,
  Eraser,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
} from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/components/ui';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/lib/chatbot/languageDictionary';

function AssistantBubble({ message, isLast, onQuickReply, onAction }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm">
        <Bot size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full whitespace-pre-line break-words rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700 shadow-sm">
          {message.text}
        </div>

        {message.action ? (
          <button
            type="button"
            onClick={() => onAction(message.action)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {message.action.type === 'tour' ? <Compass size={13} /> : <ChevronRight size={13} />}
            {message.action.label || 'Continue'}
          </button>
        ) : null}

        {isLast && message.quickReplies?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.quickReplies.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onQuickReply(suggestion)}
                className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-left text-[10.5px] font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function UserBubble({ message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-line break-words rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white shadow-sm">
        {message.text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
        <Bot size={14} />
      </span>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${dot * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatbotPanel() {
  const {
    expanded,
    typing,
    language,
    ui,
    messages,
    sendMessage,
    clearChat,
    changeLanguage,
    runAction,
    closeChat,
    toggleExpanded,
  } = useChatbot();

  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      inputRef.current?.focus();
    }
  }, []);

  const submit = () => {
    const value = draft.trim();
    if (!value || typing) return;
    setDraft('');
    sendMessage(value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section
      data-tour="chatbot-panel"
      aria-label={ui.title}
      className={cn(
        'fixed z-[80] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl animate-pop-in',
        expanded
          ? 'bottom-4 right-4 left-4 h-[82vh] sm:left-auto sm:w-[580px]'
          : 'bottom-20 right-3 left-3 h-[72vh] max-h-[620px] sm:left-auto sm:right-5 sm:w-[400px]'
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-800 bg-ink-900 px-3.5 py-3 text-white">
        <div className="flex items-start gap-2.5">
          <span className="relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/25 text-brand-100">
            <Sparkles size={17} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-emerald-400" />
          </span>
          <div>
            <h2 className="text-[13.5px] font-bold leading-tight">{ui.title}</h2>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-200">
              {ui.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            title={ui.clear}
            aria-label={ui.clear}
          >
            <Eraser size={14} />
          </button>
          <button
            type="button"
            onClick={toggleExpanded}
            className="hidden rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            title={expanded ? ui.restore : ui.maximize}
            aria-label={expanded ? ui.restore : ui.maximize}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            type="button"
            onClick={closeChat}
            className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            title={ui.close}
            aria-label={ui.close}
          >
            <X size={15} />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <Check size={11} className="text-emerald-500" />
          Reads the same live inventory state
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="Assistant language">
          {SUPPORTED_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => changeLanguage(code)}
              className={cn(
                'rounded-md px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide transition',
                language === code
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              )}
              title={LANGUAGE_LABELS[code]}
            >
              {code === 'ceb' ? 'Bis' : code}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3.5">
        {messages.map((message, index) =>
          message.role === 'user' ? (
            <UserBubble key={message.id || index} message={message} />
          ) : (
            <AssistantBubble
              key={message.id || index}
              message={message}
              isLast={index === messages.length - 1}
              onQuickReply={sendMessage}
              onAction={runAction}
            />
          )
        )}
        {typing ? <TypingBubble /> : null}
      </div>

      <div className="border-t border-slate-200 bg-white px-2.5 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            data-tour="chatbot-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={ui.placeholder}
            aria-label={ui.placeholder}
            className="max-h-24 min-h-[38px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-[12.5px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || typing}
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            aria-label={ui.send}
            title={ui.send}
          >
            <ArrowUp size={17} />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[9.5px] leading-relaxed text-slate-400">{ui.disclaimer}</p>
      </div>
    </section>
  );
}
