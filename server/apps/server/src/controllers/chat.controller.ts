// Chat controller: grounded natural-language Q&A (RAG + LLM).
// Retrieves context, builds a grounded prompt, and returns the answer with its sources.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { retrieve } from '../ai/rag/retriever.js';
import { buildMarketContext } from '../ai/chatContext.js';
import { geminiClient } from '../ai/llm/geminiClient.js';
import { buildQaPrompt } from '../ai/llm/prompts/qa.prompt.js';

export const chatController = {
  /** POST /chat  { question: string, history?: ChatMessage[] } */
  ask: asyncHandler(async (req, res) => {
    const { question, history, lang } = req.body;
    if (!question || typeof question !== 'string') {
      throw ApiError.badRequest('A "question" string is required');
    }

    // Ground the advisor in live dataset data (always) plus any RAG hits.
    const [retrieval, liveContext] = await Promise.all([
      retrieve(question, 6),
      buildMarketContext().catch(() => ''),
    ]);
    const context = [liveContext, retrieval.context].filter(Boolean).join('\n\n');

    const prompt = buildQaPrompt({ question, context, history, lang });
    const answer = await geminiClient.generate(prompt.user, {
      system: prompt.system,
      temperature: 0.3,
    });

    ok(res, { answer, sources: retrieval.sources });
  }),
};
