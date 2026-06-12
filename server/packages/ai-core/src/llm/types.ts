// LLM request/response, generation options and message role types.
// Provider-agnostic contracts; the server's Gemini client implements them.

export type MessageRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: MessageRole;
  content: string;
}

/** Tunable parameters for a single generation call. */
export interface GenerationOptions {
  /** System instruction that steers the model's behaviour. */
  system?: string;
  /** 0 = deterministic, higher = more creative. */
  temperature?: number;
  /** Upper bound on generated tokens. */
  maxOutputTokens?: number;
  /** Nucleus sampling threshold. */
  topP?: number;
  /** Top-k sampling cutoff. */
  topK?: number;
  /** Force a structured JSON response. */
  json?: boolean;
}

export interface LlmRequest {
  prompt: string;
  options?: GenerationOptions;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmResponse {
  text: string;
  model?: string;
  usage?: TokenUsage;
}
