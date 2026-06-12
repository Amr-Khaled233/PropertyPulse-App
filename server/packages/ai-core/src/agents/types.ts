// Agent types: AgentContext, AgentResult, ToolDefinition.

import type { LlmClient } from '../llm/LlmClient';
import type { Retriever } from '../rag/Retriever';

/** A capability an agent can invoke (e.g. fetch market data, run a calculation). */
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  run(input: TInput): Promise<TOutput>;
}

/** Shared services and request-scoped state handed to every agent run. */
export interface AgentContext {
  llm: LlmClient;
  retriever?: Retriever;
  /** Cooperative cancellation for long-running pipelines. */
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

/** The outcome of an agent run, including optional provenance. */
export interface AgentResult<T> {
  output: T;
  /** Optional model-produced rationale, useful for debugging/auditing. */
  reasoning?: string;
  /** Source document ids that backed the result. */
  sources?: string[];
  tokensUsed?: number;
}
