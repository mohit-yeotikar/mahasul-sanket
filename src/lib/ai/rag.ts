import { getConfiguredChat, getEmbedProvider } from "./provider";
import { createAdminClient } from "@/lib/supabase/server";
import type { ChatAnswer, Citation } from "@/types";

const RESPONSE_SCHEMA = `Respond as strict JSON:
{
  "answer": "the full answer with steps",
  "confidence": 0-100 (how well the context supports the answer),
  "used_chunks": [chunk indexes you relied on, 0-based],
  "related_questions": ["2-3 short follow-up questions in the question's language"]
}`;

// Field-officer audience (Talathi / Circle Officer / revenue staff).
const SYSTEM_PROMPT = `You are "Mahasul Sanket" (महसूल संकेत), the official AI knowledge assistant of the Maharashtra Revenue Department, helping Talathis, Circle Officers and revenue staff.

Rules:
1. Answer ONLY from the provided knowledge context. Never invent GR numbers, dates, or procedures.
2. Answer in the SAME language as the question (Marathi question → Marathi answer).
3. Be practical and step-by-step; the reader is a field officer, not a lawyer.
4. Cite which context passages you used.
5. If the context does not contain the answer, say so honestly and set confidence low.

${RESPONSE_SCHEMA}`;

// Citizen audience (ordinary public). Plain language, points to the right office.
const SYSTEM_PROMPT_CITIZEN = `You are "Mahasul Sanket" (महसूल संकेत), the official AI assistant of the Maharashtra Revenue Department, helping ordinary CITIZENS understand land and revenue services (7/12 extract, mutation/ferfar, crop entry, inheritance, certificates, and related procedures).

Rules:
1. Answer ONLY from the provided knowledge context. Never invent GR numbers, dates, fees, or procedures.
2. Answer in the SAME language as the question (Marathi question → Marathi answer).
3. Use simple, everyday language — the reader is a common citizen, not an officer or a lawyer. Avoid jargon; briefly explain any official term you must use.
4. When helpful, tell them which office or officer to approach (their village Talathi, the Tahsil office) or which official portal to use (Aaple Sarkar, Mahabhulekh, e-Peek Pahani).
5. Cite which context passages you used.
6. If the context does not contain the answer, say so honestly, set confidence low, and suggest contacting the local Talathi / Tahsil office.

${RESPONSE_SCHEMA}`;

// Used when retrieval found NO matching document. Instead of refusing, give
// helpful general guidance — clearly labelled, and without inventing official refs.
const SYSTEM_NODOC = `You are "Mahasul Sanket" (महसूल संकेत), the official AI knowledge assistant of the Maharashtra Revenue Department, helping revenue staff.

No official document in the knowledge base matched this question — but still be helpful:
1. Give practical, step-by-step GENERAL guidance based on standard Maharashtra revenue procedure.
2. Answer in the SAME language as the question (Marathi question → Marathi answer).
3. Start with a one-line note that this is general guidance, not quoted from a specific GR/circular.
4. NEVER invent GR numbers, circular numbers, or exact dates.
5. End by advising the reader to confirm with the concerned office / original GR.
Set "confidence" between 30 and 55.

${RESPONSE_SCHEMA}`;

const SYSTEM_NODOC_CITIZEN = `You are "Mahasul Sanket" (महसूल संकेत), the official AI assistant of the Maharashtra Revenue Department, helping ordinary CITIZENS.

No official document in the knowledge base matched this question — but still be helpful:
1. Explain the process in simple, everyday language based on standard Maharashtra revenue practice.
2. Answer in the SAME language as the question (Marathi question → Marathi answer).
3. Start with a one-line note that this is general guidance, not from a specific official document.
4. NEVER invent GR numbers, fees, or exact dates.
5. Tell them which office or portal to use (village Talathi, Tahsil office, Aaple Sarkar) and to confirm there.
Set "confidence" between 30 and 55.

${RESPONSE_SCHEMA}`;

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
  history: { role: "user" | "assistant"; content: string }[] = [],
  audience: "officer" | "citizen" = "officer"
): Promise<ChatAnswer> {
  const { provider: chat, model, temperature, confidenceThreshold } = await getConfiguredChat();
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
    // Tier 3: semantic search for differently-worded questions. If embeddings
    // are momentarily unavailable (e.g. a Gemini rate-limit/hiccup), degrade
    // gracefully to the keyword results instead of failing the whole answer.
    try {
      const embedding = await getEmbedProvider().embed(question);
      const { data: semChunks, error } = await db.rpc("search_knowledge", {
        query_embedding: embedding,
        query_text: question,
        match_count: 8,
        min_similarity: 0.3,
      });
      if (error) throw new Error(`Knowledge search failed: ${error.message}`);
      chunks = semChunks ?? [];
    } catch (e) {
      console.error("Semantic search unavailable, falling back to keyword results:", e);
      chunks = keyword;
    }
  }

  const context = (chunks ?? [])
    .map(
      (c: Record<string, unknown>, i: number) =>
        `[${i}] Document: ${c.title}${c.gr_number ? ` | GR: ${c.gr_number}` : ""}${
          c.circular_number ? ` | Circular: ${c.circular_number}` : ""
        }${c.page_number ? ` | Page: ${c.page_number}` : ""}\n${c.content}`
    )
    .join("\n\n---\n\n");

  // When we DID find documents, answer strictly from them (grounded + cited).
  // When we found NOTHING, don't refuse — give helpful general guidance.
  const hasContext = (chunks?.length ?? 0) > 0;
  const systemPrompt = hasContext
    ? (audience === "citizen" ? SYSTEM_PROMPT_CITIZEN : SYSTEM_PROMPT)
    : (audience === "citizen" ? SYSTEM_NODOC_CITIZEN : SYSTEM_NODOC);

  const raw = await chat.chat(
    [
      { role: "system", content: systemPrompt },
      ...history.slice(-6),
      {
        role: "user",
        content: hasContext
          ? `KNOWLEDGE CONTEXT:\n${context}\n\nQUESTION: ${question}`
          : `QUESTION: ${question}`,
      },
    ],
    { json: true, model, temperature }
  );

  const parsed = parseModelJson(raw, !!chunks?.length);

  const used = new Set(parsed.used_chunks ?? []);
  const citations: Citation[] = toCitations(chunks, used);

  const threshold = confidenceThreshold;
  const confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0)));

  return {
    answer: parsed.answer ?? "",
    confidence,
    citations,
    related_questions: (parsed.related_questions ?? []).slice(0, 3),
    escalation_suggested: confidence < threshold,
  };
}
