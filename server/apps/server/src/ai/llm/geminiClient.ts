// Gemini LLM client — the single entry point for all text generation and embeddings.
// Wraps @google/generative-ai with convenience methods for plain text, JSON, streaming
// and embeddings, so the rest of the codebase never touches the SDK directly.
//
// Implements the provider-agnostic `LlmClient` contract from @propertypulse/ai-core,
// so the shared contract and this concrete implementation stay in sync at compile time.

import type { GenerationConfig } from '@google/generative-ai';
import type { LlmClient, GenerationOptions, EmbeddingVector } from '@propertypulse/ai-core';
import { genAI } from '../../config/gemini.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/** Translate the shared GenerationOptions into the Gemini SDK's generationConfig. */
function toGenerationConfig(opts: GenerationOptions): GenerationConfig {
  return {
    temperature: opts.temperature ?? 0.4,
    ...(opts.maxOutputTokens !== undefined ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    ...(opts.topP !== undefined ? { topP: opts.topP } : {}),
    ...(opts.topK !== undefined ? { topK: opts.topK } : {}),
    ...(opts.json ? { responseMimeType: 'application/json' } : {}),
  };
}

/** Retry transient Gemini failures (503 overload / 429 rate-limit) with backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const transient = /\[(503|429|500)|overload|high demand|rate limit|unavailable/i.test(msg);
      if (!transient || i === attempts - 1) throw err;
      const delay = 800 * 2 ** i + Math.floor(Math.random() * 400);
      logger.warn({ attempt: i + 1, delay }, 'Gemini transient error — retrying');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

class GeminiClient implements LlmClient {
  async generate(prompt: string, opts: GenerationOptions = {}): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: opts.model ?? env.GEMINI_MODEL,
      systemInstruction: opts.system,
      generationConfig: toGenerationConfig(opts),
    });

    const result = await withRetry(() => model.generateContent(prompt));
    return result.response.text();
  }

  /** Generate a JSON response and parse it into the expected shape. */
  async generateJSON<T>(prompt: string, opts: Omit<GenerationOptions, 'json'> = {}): Promise<T> {
    const text = await this.generate(prompt, { ...opts, json: true });
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      logger.error({ err, text }, 'Failed to parse Gemini JSON response');
      throw new Error('LLM returned invalid JSON');
    }
  }

  /** Stream a response token-by-token (used by the chat endpoint). */
  async *stream(prompt: string, opts: GenerationOptions = {}): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({
      model: opts.model ?? env.GEMINI_MODEL,
      systemInstruction: opts.system,
      generationConfig: toGenerationConfig({ ...opts, json: false }),
    });

    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  /** Produce an embedding vector for a single piece of text. */
  async embed(text: string): Promise<EmbeddingVector> {
    const model = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
    const result = await withRetry(() => model.embedContent(text));
    return result.embedding.values;
  }
}

export const geminiClient: LlmClient = new GeminiClient();
