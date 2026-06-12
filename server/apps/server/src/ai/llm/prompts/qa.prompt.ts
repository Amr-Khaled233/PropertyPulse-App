// Prompt template for grounded natural-language Q&A (RAG chat).
// The retrieved context is the ONLY source of truth; the model must say when it
// doesn't know rather than hallucinate.

import type { ChatMessage } from '@propertypulse/shared-types';

export interface QaPromptInput {
  question: string;
  context: string;
  history?: ChatMessage[];
  lang?: 'en' | 'ar';
}

export interface QaPromptOutput {
  system: string;
  user: string;
}

export function buildQaPrompt(input: QaPromptInput): QaPromptOutput {
  const { question, context, history = [], lang } = input;

  const langLine =
    lang === 'ar'
      ? 'IMPORTANT: Write your entire answer in Arabic.'
      : lang === 'en'
        ? 'IMPORTANT: Write your entire answer in English.'
        : "Reply in the user's language (Arabic or English).";

  const system = [
    'You are PropertyPulse, an expert real-estate investment advisor for the Cairo & Giza (Egypt) market.',
    'You are given LIVE CONTEXT with real platform data: dataset overview, market trends and sample listings (prices in EGP).',
    'Ground your answer in that live data first — quote concrete figures (prices, yields, areas, locations) from it when relevant.',
    'You may also apply general real-estate reasoning to interpret the data and give practical guidance.',
    'Never reply that there is "no context" — the live data above is always available. If a specific number is missing, give a best estimate and label it as an estimate.',
    'Be concise, concrete and practical. Use short paragraphs or bullets.',
    langLine,
  ].join(' ');

  const historyText = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const user = `
${historyText ? `CONVERSATION SO FAR\n${historyText}\n\n` : ''}LIVE CONTEXT
${context || '(no live data available)'}

QUESTION
${question}`.trim();

  return { system, user };
}
