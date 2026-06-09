import type { ChatMessage } from '@propertypulse/shared-types';
import { apiClient } from './apiClient';
import { env } from '../../config/env';

export interface ChatAnswer {
  answer: string;
  sources: string[];
}

const demoReplies = [
  'Based on your current allocation, New Cairo commercial assets offer the strongest risk-adjusted upside this quarter (projected +15% net yield).',
  'Your portfolio is concentrated in residential. Diversifying ~20% into coastal short-let could lift blended yield to ~7.8%.',
  'The Obsidian Villa scores highest on our pulse index (9.4) thanks to supply compression and rental demand in its micro-market.',
];

export const chatService = {
  async ask(question: string, history: ChatMessage[] = []): Promise<ChatAnswer> {
    if (env.hasSupabase) {
      try {
        const { data } = await apiClient.post<ChatAnswer>('/chat', { question, history });
        if (data?.answer) return data;
      } catch {
        /* fall through to demo reply */
      }
    }
    await new Promise((r) => setTimeout(r, 700));
    const reply = demoReplies[Math.floor(Math.random() * demoReplies.length)];
    return { answer: reply, sources: ['Demo market model'] };
  },
};