// Retriever interface: embed(), search(topK), ingest() — implemented over Supabase pgvector.

import type { Document, EmbeddingVector, RetrievalResult } from './types';

export interface Retriever {
  /** Embed a piece of text into a vector. */
  embed(text: string): Promise<EmbeddingVector>;

  /** Semantic search: returns the top-K most relevant chunks for a query. */
  search(query: string, topK?: number, source?: string): Promise<RetrievalResult>;

  /** Chunk, embed and persist documents. Returns the number of chunks stored. */
  ingest(documents: Document[]): Promise<number>;
}
