'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useApp } from '@/context/AppProvider';
import { useWalkthrough } from '@/hooks/useWalkthrough';
import { respond } from '@/lib/chatbot/responseEngine';
import {
  SUPPORTED_LANGUAGES,
  UI_TEXT,
  uiText,
} from '@/lib/chatbot/languageDictionary';
import { CHAT_STORAGE_KEY, readLocal, writeLocal } from '@/lib/storage';
import { newId } from '@/lib/id';

const ChatbotContext = createContext(null);

const LANGUAGE_CONFIRM = {
  en: "Okay — I'll continue in English.",
  tl: 'Sige — magpapatuloy tayo sa Tagalog.',
  ceb: 'Sige — magpadayon kita sa Cebuano.',
};

function welcomeMessage(language = 'en') {
  const copy = uiText(language);
  return {
    id: newId('msg'),
    role: 'assistant',
    text: copy.welcome,
    quickReplies: copy.welcomeSuggestions.slice(0, 4),
    at: new Date().toISOString(),
    welcome: true,
  };
}

function readSavedConversation() {
  const saved = readLocal(CHAT_STORAGE_KEY);
  if (!saved || !Array.isArray(saved.messages) || saved.messages.length === 0) return null;
  const language = SUPPORTED_LANGUAGES.includes(saved.language) ? saved.language : 'en';
  return {
    language,
    messages: saved.messages.filter(
      (message) => message && typeof message.text === 'string' && message.role
    ),
    lastProductId: saved.lastProductId || null,
  };
}

export function ChatbotProvider({ children }) {
  const router = useRouter();
  const { products, suppliers, transactions, recommendations, settings, user } = useApp();
  const { startTour } = useWalkthrough();

  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([]);
  const [lastProductId, setLastProductId] = useState(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [typing, setTyping] = useState(false);

  const timers = useRef([]);
  const stateRef = useRef({ products, suppliers, transactions, recommendations, settings, user });
  stateRef.current = { products, suppliers, transactions, recommendations, settings, user };

  useEffect(() => {
    const saved = readSavedConversation();
    if (saved) {
      setLanguage(saved.language);
      setMessages(saved.messages);
      setLastProductId(saved.lastProductId);
    } else {
      setMessages([welcomeMessage('en')]);
    }
    setReady(true);
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeLocal(CHAT_STORAGE_KEY, { language, messages, lastProductId });
  }, [ready, language, messages, lastProductId]);

  const sendMessage = useCallback(
    (rawText) => {
      const text = String(rawText || '').trim();
      if (!text) return;
      if (typing) return;

      const userMessage = {
        id: newId('msg'),
        role: 'user',
        text,
        at: new Date().toISOString(),
      };
      setMessages((previous) => [...previous, userMessage]);
      setTyping(true);

      let result;
      try {
        result = respond({
          text,
          state: stateRef.current,
          user: stateRef.current.user,
          language,
          lastProductId,
        });
      } catch (error) {
        console.error('[StockSense] assistant response failed', error);
        result = {
          ok: false,
          language,
          text: 'The local assistant hit an unexpected problem. No inventory data was changed. Please try rephrasing your question.',
          quickReplies: [],
          action: null,
          lastProductId,
        };
      }

      const timer = setTimeout(() => {
        if (result.language && result.language !== language && SUPPORTED_LANGUAGES.includes(result.language)) {
          setLanguage(result.language);
        }
        if (result.intent === 'clear_chat') {
          setMessages([welcomeMessage(result.language || language)]);
          setLastProductId(null);
        } else {
          setMessages((previous) => [
            ...previous,
            {
              id: newId('msg'),
              role: 'assistant',
              text: result.text,
              action: result.action || null,
              quickReplies: result.quickReplies || [],
              intent: result.intent || null,
              at: new Date().toISOString(),
            },
          ]);
          if (result.lastProductId) setLastProductId(result.lastProductId);
        }
        setTyping(false);
      }, 420);

      timers.current.push(timer);
    },
    [language, lastProductId, typing]
  );

  const clearChat = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
    setTyping(false);
    setLastProductId(null);
    setMessages([welcomeMessage(language)]);
  }, [language]);

  const changeLanguage = useCallback(
    (nextLanguage) => {
      if (!SUPPORTED_LANGUAGES.includes(nextLanguage) || nextLanguage === language) return;
      setLanguage(nextLanguage);
      setMessages((previous) => [
        ...previous,
        {
          id: newId('msg'),
          role: 'assistant',
          text: LANGUAGE_CONFIRM[nextLanguage] || LANGUAGE_CONFIRM.en,
          quickReplies: uiText(nextLanguage).welcomeSuggestions.slice(0, 3),
          at: new Date().toISOString(),
          languageNotice: true,
        },
      ]);
    },
    [language]
  );

  const runAction = useCallback(
    (action) => {
      if (!action) return;
      if (action.type === 'navigate' && action.href) {
        setOpen(false);
        router.push(action.href);
        return;
      }
      if (action.type === 'tour' && action.tourId) {
        const started = startTour(action.tourId);
        if (started) setOpen(false);
        return;
      }
      toast.error('That assistant action is not available.');
    },
    [router, startTour]
  );

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);
  const toggleChat = useCallback(() => setOpen((current) => !current), []);
  const toggleExpanded = useCallback(() => setExpanded((current) => !current), []);

  const value = useMemo(
    () => ({
      ready,
      open,
      expanded,
      typing,
      language,
      languageLabel: uiText(language).subtitle,
      ui: uiText(language),
      messages,
      lastProductId,
      sendMessage,
      clearChat,
      changeLanguage,
      runAction,
      openChat,
      closeChat,
      toggleChat,
      toggleExpanded,
    }),
    [
      changeLanguage,
      clearChat,
      expanded,
      language,
      lastProductId,
      messages,
      open,
      openChat,
      closeChat,
      ready,
      runAction,
      sendMessage,
      toggleChat,
      toggleExpanded,
      typing,
    ]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used inside <ChatbotProvider>.');
  }
  return context;
}

export default ChatbotContext;
