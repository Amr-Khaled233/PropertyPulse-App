// LlmClient interface: generate(), generateJSON(), stream(), embed() —
// implemented by the server's Gemini client. Keeps the rest of the codebase
// decoupled from any specific provider SDK.

import type { EmbeddingVector } from '../rag/types';
import type { GenerationOptions } from './types';

export interface LlmClient {
  /** Generate plain text for a prompt. */
  generate(prompt: string, options?: GenerationOptions): Promise<string>;

  /** Generate a JSON response and parse it into the expected shape. */
  generateJSON<T>(prompt: string, options?: Omit<GenerationOptions, 'json'>): Promise<T>;

  /** Stream a response token-by-token (used by the chat endpoint). */
  stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string>;

  /** Produce an embedding vector for a single piece of text. */
  embed(text: string): Promise<EmbeddingVector>;
}
