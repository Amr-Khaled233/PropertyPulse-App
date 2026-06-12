// Ingestion pipeline: load a source document -> chunk -> embed -> upsert into rag_chunks.
// Also runnable directly as a CLI via `npm run ingest`.

import { fileURLToPath } from 'node:url';
import { createDocument, upsertChunks } from './vectorStore.js';
import { chunkText, type ChunkOptions } from './chunking.js';
import { embedBatch } from './embeddings.js';
import { logger } from '../../utils/logger.js';

export interface IngestInput {
  /** listing | rental_stats | neighborhood | economic | regulation */
  source: string;
  text: string;
  title?: string;
  refId?: string;
  metadata?: Record<string, unknown>;
  chunkOptions?: ChunkOptions;
}

export interface IngestResult {
  documentId: string;
  /** Number of chunks embedded and stored for the document. */
  chunkCount: number;
}

/** Ingest one document and return its id and the number of chunks stored. */
export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const documentId = await createDocument(input.source, input.title, input.refId, input.metadata);

  const chunks = chunkText(input.text, input.chunkOptions);
  const embeddings = await embedBatch(chunks);

  await upsertChunks(
    documentId,
    chunks.map((content, index) => ({ index, content, embedding: embeddings[index] })),
  );

  logger.info({ documentId, chunks: chunks.length, source: input.source }, 'Ingested document');
  return { documentId, chunkCount: chunks.length };
}

export async function ingestMany(inputs: IngestInput[]): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const input of inputs) results.push(await ingestDocument(input));
  return results;
}

// --- CLI entry -------------------------------------------------------------
async function main(): Promise<void> {
  logger.info('RAG ingestion CLI. Wire up your data sources here, then run `npm run ingest`.');
  // Example:
  // await ingestDocument({ source: 'neighborhood', title: 'New Cairo', text: '...' });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
