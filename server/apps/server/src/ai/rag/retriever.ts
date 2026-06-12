// Retriever: embeds a query and runs semantic search, returning ready-to-inject context.
// Conforms to the `Retriever` contract from @propertypulse/ai-core (pgvector-backed).

import type {
  Retriever,
  RetrievalResult,
  ScoredChunk,
  EmbeddingVector,
  Document,
} from '@propertypulse/ai-core';
import { embedText } from './embeddings.js';
import { matchChunks } from './vectorStore.js';
import { ingestDocument } from './ingestion.js';
import { logger } from '../../utils/logger.js';

// Re-export the shared shape so existing imports (`from '../rag/retriever.js'`) keep working.
export type { RetrievalResult } from '@propertypulse/ai-core';

const EMPTY_RESULT: RetrievalResult = { context: '', chunks: [], sources: [] };

export async function retrieve(
  query: string,
  topK = 5,
  source?: string,
): Promise<RetrievalResult> {
  // RAG is supplementary context. If embedding or the vector search fails (e.g.
  // the embedding model is unavailable, or the knowledge base is empty), the
  // report/chat should still succeed using the structured metrics & market data.
  try {
    const embedding = await embedText(query);
    const matched = await matchChunks(embedding, topK, source);

    const chunks: ScoredChunk[] = matched.map((c, i) => ({
      id: c.id,
      documentId: c.document_id,
      index: i,
      content: c.content,
      score: c.similarity,
    }));

    const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
    const sources = [...new Set(chunks.map((c) => c.documentId))];

    return { context, chunks, sources };
  } catch (err) {
    logger.warn({ err }, 'RAG retrieval failed — continuing without retrieved context');
    return EMPTY_RESULT;
  }
}

/** The pgvector-backed implementation of the shared `Retriever` contract. */
export const ragRetriever: Retriever = {
  embed(text: string): Promise<EmbeddingVector> {
    return embedText(text);
  },

  search(query: string, topK?: number, source?: string): Promise<RetrievalResult> {
    return retrieve(query, topK, source);
  },

  async ingest(documents: Document[]): Promise<number> {
    let chunks = 0;
    for (const doc of documents) {
      const { chunkCount } = await ingestDocument({
        source: doc.source,
        text: doc.content,
        title: doc.title,
        refId: doc.id,
        metadata: doc.metadata,
      });
      chunks += chunkCount;
    }
    return chunks;
  },
};
