// Embedding generation via Gemini text-embedding-004 (768 dimensions).

import type { EmbeddingVector } from '@propertypulse/ai-core';
import { geminiClient } from '../llm/geminiClient.js';

export async function embedText(text: string): Promise<EmbeddingVector> {
  return geminiClient.embed(text);
}

/** Embed many texts. Sequential to stay within rate limits; batch upstream if needed. */
export async function embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
  const out: EmbeddingVector[] = [];
  for (const text of texts) {
    out.push(await embedText(text));
  }
  return out;
}
