// AI Advisor — RAG chat endpoint (mirrors the web AdvisorPanel).
//   POST /chat { question, history, lang } → { answer, sources[] }

import { apiClient } from './apiClient';
import type { ChatMessage } from '../../types/api';

export interface ChatAnswer {
  answer: string;
  sources: string[];
}

export const chatService = {
  async ask(question: string, history: ChatMessage[] = [], lang: 'en' | 'ar' = 'en'): Promise<ChatAnswer> {
    const { data } = await apiClient.post<ChatAnswer>('/chat', { question, history, lang });
    return data;
  },
};
