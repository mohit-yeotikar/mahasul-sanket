import { getAIProvider } from "./provider";
import { createAdminClient } from "@/lib/supabase/server";
import type { ChatAnswer, Citation } from "@/types";

const SYSTEM_PROMPT = `You are "Mahasul Sanket" (महसूल संकेत), the official AI knowledge assistant of the Maharashtra Revenue Department, helping Talathis, Circle Officers and revenue staff.

Rules:
1. Answer ONLY from the provided knowledge context. Never invent GR numbers, dates, or procedures.
2. Answer in the SAME language as the question (Marathi question → Marathi answer).
3. Be practical and step-by-step; the reader is a field officer, not a lawyer.
4. Cite which context passages you used.
5. If the context does not contain the answer, say so honestly and set confidence low.

Respond as strict JSON:
{
  "answer": "the full answer with steps",
  "confidence": 0-100 (how well the context supports the answer),
  "used_chunks": [chunk indexes you relied on, 0-based],
  "related_questions": ["2-3 short follow-up questions in the question's language"]
}`;

interface ModelJson {
  answer?: string;
  confidence?: number;
  used_chunks?: number[];
  related_questions?: string[];
}

/**
 * Parse the model's JSON reply defensively. Models sometimes wrap JSON in
 * code fences or get truncated mid-string — the user must NEVER see raw JSON.
 */
function parseModelJson(raw: string, hadContext: boolean): ModelJson {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  try {
    return JSON.parse(cleaned);
  } catch { /* fall through */ }

  // Truncated JSON: extract the "answer" string value manually,
  // honouring escape sequences up to the cut-off point.
  const m = cleaned.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (m) {
    let answer: string;
    try {
      answer = JSON.parse(`"${m[1]}"`); // decode \n, \" etc.
    } catch {
      answer = m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
    const conf = cleaned.match(/"confidence"\s*:\s*(\d+)/);
    return {
      answer,
      confidence: conf ? Number(conf[1]) : hadContext ? 55 : 15,
      used_chunks: [],
      related_questions: [],
    };
  }

  // Not JSON at all — treat the whole reply as the answer.
  return {
    answer: cleaned,
    confidence: hadContext ? 50 : 15,
    used_chunks: [],
    related_questions: [],
  };
}

type ChunkRow = Record<string, unknown>;

function toCitations(chunks: ChunkRow[], used: Set<number>): Citation[] {
  return chunks
    .filter((_, i) => used.size === 0 || used.has(i))
    .slice(0, 5)
    .map((c) => ({
      document_id: c.document_id as string,
      title: c.title as string,
      page_number: (c.page_number as number) ?? null,
      gr_number: (c.gr_number as string) ?? null,
      circular_number: (c.circular_number as string) ?? null,
      department: (c.department as string) ?? null,
      issued_date: (c.issued_date as string) ?? null,
      similarity: Math.round(((c.similarity as number) ?? 0) * 100) / 100,
    }));
}

/**
 * Local-first answering ladder (minimises external AI dependency):
 *   Tier 1 — strong FAQ keyword match in Postgres → answer directly, NO AI call.
 *   Tier 2 — decent keyword matches → skip embedding, one AI call to compose.
 *   Tier 3 — keywords found nothing → full semantic search (embed + compose).
 */
export async function answerQuestion(
  question: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<ChatAnswer> {
  const ai = getAIProvider();
  const db = createAdminClient();

  // ── Tier 1+2: pure-Postgres keyword search (no AI) ──
  const { data: kwChunks } = await db.rpc("search_knowledge_keyword", {
    query_text: question,
    match_count: 8,
  });
  const keyword: ChunkRow[] = kwChunks ?? [];
  const top = keyword[0];

  // Tier 1: an approved FAQ that matches strongly is authoritative — serve it as-is.
  if (top && top.doc_type === "faq" && (top.similarity as number) >= 0.4) {
    const content = top.content as string;
    // FAQ chunks are stored as "प्रश्न/Question: ... अधिकृत उत्तर/Official answer: ..."
    const answer =
      content.replace(/^[\s\S]*?(?:अधिकृत उत्तर|Official answer)\s*[:/]?\s*/, "").trim() || content;
    return {
      answer,
      confidence: 90,
      citations: toCitations([top], new Set()),
      related_questions: [],
      escalation_suggested: false,
    };
  }

  let chunks: ChunkRow[];
  if (keyword.length >= 2 && (top?.similarity as number) >= 0.25) {
    // Tier 2: good local matches — no embedding call needed.
    chunks = keyword;
  } else {
    // Tier 3: semantic search for differently-worded questions.
    const embedding = await ai.embed(question);
    const { data: semChunks, error } = await db.rpc("search_knowledge", {
      query_embedding: embedding,
      query_text: question,
      match_count: 8,
      min_similarity: 0.45,
    });
    if (error) throw new Error(`Knowledge search failed: ${error.message}`);
    chunks = semChunks ?? [];
  }

  const context = (chunks ?? [])
    .map(
      (c: Record<string, unknown>, i: number) =>
        `[${i}] Document: ${c.title}${c.gr_number ? ` | GR: ${c.gr_number}` : ""}${
          c.circular_number ? ` | Circular: ${c.circular_number}` : ""
        }${c.page_number ? ` | Page: ${c.page_number}` : ""}\n${c.content}`
    )
    .join("\n\n---\n\n");

  const raw = await ai.chat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6),
      {
        role: "user",
        content: `KNOWLEDGE CONTEXT:\n${context || "(no relevant documents found)"}\n\nQUESTION: ${question}`,
      },
    ],
    { json: true }
  );

  const parsed = parseModelJson(raw, !!chunks?.length);

  const used = new Set(parsed.used_chunks ?? []);
  const citations: Citation[] = toCitations(chunks, used);

  const threshold = Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 60);
  const confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0)));

  return {
    answer: parsed.answer ?? "",
    confidence,
    citations,
    related_questions: (parsed.related_questions ?? []).slice(0, 3),
    escalation_suggested: confidence < threshold,
  };
}
