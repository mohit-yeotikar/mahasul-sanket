// Auto-catalogue an uploaded document: read its text and let the AI assign a
// title, description, doc type and service category. Used by bulk ingestion so
// the admin doesn't type metadata for every GR.

import { getChatProvider } from "./provider";

export type DocType = "gr" | "circular" | "faq" | "sop" | "notification" | "manual" | "other";

export interface DocMetadata {
  title: string;
  title_mr: string | null;
  summary: string;
  docType: DocType;
  category: string;
  grNumber: string | null;
  circularNumber: string | null;
  department: string | null;
  issuedDate: string | null; // YYYY-MM-DD
  tags: string[];
}

const DOC_TYPES: DocType[] = ["gr", "circular", "faq", "sop", "notification", "manual", "other"];
const CATEGORIES = [
  "mutation", "seven_twelve", "ferfar", "crop_entry", "inheritance", "revenue",
  "survey", "map", "certificates", "digital_signature", "technical_issue", "others",
];

const SYSTEM = `You catalogue official Government of Maharashtra Revenue Department documents (शासन निर्णय / GR, circulars, SOPs, notifications) for a knowledge base.

Read the document text and return STRICT JSON only (no markdown fences), with these keys:
{
  "title": "concise descriptive title in the document's own language, <= 180 chars",
  "title_mr": "Marathi title (translate if the doc is in English), or null",
  "summary": "2-3 sentence plain summary of what the document says/orders",
  "doc_type": one of ${JSON.stringify(DOC_TYPES)},
  "category": one of ${JSON.stringify(CATEGORIES)} (best-fit service area),
  "gr_number": "GR / शासन निर्णय क्रमांक if present, else null",
  "circular_number": "circular number if present, else null",
  "department": "issuing department/office if stated, else null",
  "issued_date": "YYYY-MM-DD if a date is present, else null",
  "tags": ["3-6 short Marathi/English keywords"]
}

Rules: use ONLY the allowed enum values; never invent GR numbers or dates that are not in the text; if unsure, use null (or "other"/"others").`;

function parseJson(raw: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
    return {};
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function autoCatalog(text: string, fallbackTitle: string): Promise<DocMetadata> {
  const ai = getChatProvider();
  const excerpt = text.slice(0, 6000);

  let parsed: Record<string, unknown> = {};
  try {
    const raw = await ai.chat(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `DOCUMENT TEXT:\n${excerpt}` },
      ],
      { json: true }
    );
    parsed = parseJson(raw);
  } catch {
    // AI unavailable — fall back to filename-based metadata below.
  }

  const docType = (DOC_TYPES as string[]).includes(String(parsed.doc_type))
    ? (parsed.doc_type as DocType)
    : "gr";
  const category = (CATEGORIES as string[]).includes(String(parsed.category))
    ? String(parsed.category)
    : "others";
  const issued = str(parsed.issued_date);
  const issuedDate = issued && /^\d{4}-\d{2}-\d{2}$/.test(issued) ? issued : null;
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    title: (str(parsed.title) ?? fallbackTitle).slice(0, 200),
    title_mr: str(parsed.title_mr),
    summary: (str(parsed.summary) ?? "").slice(0, 800),
    docType,
    category,
    grNumber: str(parsed.gr_number),
    circularNumber: str(parsed.circular_number),
    department: str(parsed.department),
    issuedDate,
    tags,
  };
}
