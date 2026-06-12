// Vector store adapter over Supabase pgvector (rag_documents + rag_chunks).

import { supabase } from '../../config/supabase.js';
import { ApiError } from '../../utils/apiError.js';

export interface MatchedChunk {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
}

export interface ChunkInput {
  index: number;
  content: string;
  embedding: number[];
}

/** Create a rag_documents row and return its id. */
export async function createDocument(
  source: string,
  title?: string,
  refId?: string,
  metadata: Record<string, unknown> = {},
): Promise<string> {
  const { data, error } = await supabase
    .from('rag_documents')
    .insert({ source, title: title ?? null, ref_id: refId ?? null, metadata })
    .select('id')
    .single();

  if (error) throw new ApiError(500, 'RAG_DOC_INSERT_FAILED', error.message);
  return (data as { id: string }).id;
}

/** Insert the embedded chunks for a document. */
export async function upsertChunks(documentId: string, chunks: ChunkInput[]): Promise<void> {
  if (chunks.length === 0) return;
  const rows = chunks.map((c) => ({
    document_id: documentId,
    chunk_index: c.index,
    content: c.content,
    embedding: c.embedding,
  }));

  const { error } = await supabase.from('rag_chunks').insert(rows);
  if (error) throw new ApiError(500, 'RAG_CHUNK_INSERT_FAILED', error.message);
}

/** Cosine-similarity search via the match_rag_chunks RPC defined in migration 0005. */
export async function matchChunks(
  embedding: number[],
  matchCount = 5,
  source?: string,
): Promise<MatchedChunk[]> {
  const { data, error } = await supabase.rpc('match_rag_chunks', {
    query_embedding: embedding,
    match_count: matchCount,
    filter_source: source ?? null,
  });

  if (error) throw new ApiError(500, 'RAG_MATCH_FAILED', error.message);
  return (data as MatchedChunk[]) ?? [];
}
