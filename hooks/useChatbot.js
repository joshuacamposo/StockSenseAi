'use client';

import { useChatbotContext } from '@/context/ChatbotContext';

export function useChatbot() {
  return useChatbotContext();
}

export default useChatbot;
