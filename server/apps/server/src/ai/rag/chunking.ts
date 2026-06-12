// Document chunking utilities for ingestion. Splits long text into overlapping windows
// on paragraph/sentence boundaries so embeddings keep semantic coherence.

export interface ChunkOptions {
  /** Target chunk size in characters. */
  size?: number;
  /** Overlap between consecutive chunks in characters. */
  overlap?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const size = options.size ?? 1000;
  const overlap = options.overlap ?? 150;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= size) return clean ? [clean] : [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    // Prefer to break at the last sentence boundary inside the window.
    if (end < clean.length) {
      const boundary = clean.lastIndexOf('. ', end);
      if (boundary > start + size * 0.5) end = boundary + 1;
    }

    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
  }

  return chunks;
}
