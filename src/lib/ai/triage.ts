// L2 (Nayab Tahsildar) smart ticket triage — the AI suggests a category, a
// priority, and a knowledge-grounded draft reply for a support ticket. The
// officer reviews and applies; nothing is changed automatically.

import { answerQuestion } from "./rag";
import { getConfiguredChat } from "./provider";

export const TRIAGE_CATEGORIES = [
  "mutation", "seven_twelve", "ferfar", "crop_entry", "inheritance",
  "revenue", "survey", "map", "certificates", "digital_signature",
  "technical_issue", "others",
] as const;

export const TRIAGE_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export interface TriageResult {
  category: string;
  priority: string;
  reason: string;
  draft: string;
  confidence: number;
  citations: { title: string; gr_number: string | null }[];
}

export async function triageTicket(subject: string, description: string): Promise<TriageResult> {
  const question = `${subject}\n\n${description}`.trim();

  // 1) Knowledge-grounded draft answer (reuses the RAG pipeline + citations).
  const ans = await answerQuestion(question, [], "officer");

  // 2) Classify category + priority with a small structured call.
  const { provider, model, temperature } = await getConfiguredChat();
  const sys = `You triage support tickets for the Maharashtra Revenue Department.
Classify the ticket into exactly one category and one priority.
Categories: ${TRIAGE_CATEGORIES.join(", ")}.
Priority guide: critical = legal deadline / large public impact; high = a citizen is blocked; medium = normal request; low = information only.
Respond as strict JSON: {"category": "<one category>", "priority": "<low|medium|high|critical>", "reason": "one short sentence in the SAME language as the ticket"}`;

  let category = "others";
  let priority = "medium";
  let reason = "";
  try {
    const raw = await provider.chat(
      [
        { role: "system", content: sys },
        { role: "user", content: `SUBJECT: ${subject}\nDESCRIPTION: ${description}` },
      ],
      { json: true, model, temperature }
    );
    const j = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
    if (typeof j.category === "string" && (TRIAGE_CATEGORIES as readonly string[]).includes(j.category)) category = j.category;
    if (typeof j.priority === "string" && (TRIAGE_PRIORITIES as readonly string[]).includes(j.priority)) priority = j.priority;
    if (typeof j.reason === "string") reason = j.reason.slice(0, 300);
  } catch {
    // fall back to safe defaults (others/medium) — the officer still decides.
  }

  return {
    category,
    priority,
    reason,
    draft: ans.answer,
    confidence: ans.confidence,
    citations: (ans.citations ?? []).slice(0, 3).map((c) => ({ title: c.title, gr_number: c.gr_number })),
  };
}
