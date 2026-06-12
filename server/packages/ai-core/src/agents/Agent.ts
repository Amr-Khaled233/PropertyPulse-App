// Base Agent contract: name, run(input,ctx), tools. Used by the server orchestrator.

import type { AgentContext, AgentResult, ToolDefinition } from './types';

export interface Agent<TInput = unknown, TOutput = unknown> {
  /** Stable, human-readable identifier used in logs and tracing. */
  readonly name: string;
  /** Tools this agent may call during a run. */
  readonly tools?: ToolDefinition[];
  /** Execute the agent against an input within the given context. */
  run(input: TInput, ctx: AgentContext): Promise<AgentResult<TOutput>>;
}

/** Optional base class that fills in the boilerplate for concrete agents. */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown>
  implements Agent<TInput, TOutput>
{
  abstract readonly name: string;
  readonly tools: ToolDefinition[] = [];

  abstract run(input: TInput, ctx: AgentContext): Promise<AgentResult<TOutput>>;
}
