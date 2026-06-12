// RAG types: Document, Chunk, EmbeddingVector, RetrievalResult.

/** A dense embedding vector (Gemini text-embedding-004 => 768 dimensions). */
export type EmbeddingVector = number[];

/** A source document before chunking. */
export interface Document {
  id: string;
  source: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/** A slice of a document, optionally with its embedding. */
export interface Chunk {
  id: string;
  documentId: string;
  index: number;
  content: string;
  embedding?: EmbeddingVector;
  metadata?: Record<string, unknown>;
}

/** A chunk paired with its similarity score from a search. */
export interface ScoredChunk extends Chunk {
  /** Similarity score (higher = closer). */
  score: number;
}

/** The output of a retrieval call, ready to inject into a prompt. */
export interface RetrievalResult {
  /** Numbered, concatenated chunk text ready to drop into a prompt. */
  context: string;
  chunks: ScoredChunk[];
  /** Distinct source document ids backing the answer. */
  sources: string[];
}
