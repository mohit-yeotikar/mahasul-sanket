// Document ingestion: text → chunks → embeddings → pgvector.
// Upload → OCR/extract → Chunk → Embed → Store → AI retrieval.

import { getAIProvider } from "./provider";
import { createAdminClient } from "@/lib/supabase/server";

/** Sentence-aware chunking with overlap, tuned for GR/circular prose. */
export function chunkText(text: string, maxChars = 1400, overlap = 200): string[] {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);
    if (end < clean.length) {
      // Prefer breaking on paragraph, then sentence (Devanagari danda । or .), then space
      const slice = clean.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("।"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n")
      );
      if (breakAt > maxChars * 0.4) end = start + breakAt + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks.filter((c) => c.length > 30);
}

/** Embed and store chunks for a document. Marks it pending_approval when done. */
export async function ingestDocumentText(
  documentId: string,
  pages: { text: string; page: number | null }[]
): Promise<{ chunks: number }> {
  const ai = getAIProvider();
  const db = createAdminClient();

  await db.from("document_chunks").delete().eq("document_id", documentId);

  let index = 0;
  for (const { text, page } of pages) {
    for (const content of chunkText(text)) {
      const embedding = await ai.embed(content);
      const { error } = await db.from("document_chunks").insert({
        document_id: documentId,
        chunk_index: index++,
        content,
        page_number: page,
        embedding,
        token_count: Math.ceil(content.length / 4),
      });
      if (error) throw new Error(`Chunk insert failed: ${error.message}`);
    }
  }

  await db
    .from("documents")
    .update({ status: "pending_approval" })
    .eq("id", documentId)
    .eq("status", "processing");

  return { chunks: index };
}
