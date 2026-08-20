// L1 Talathi draft generator — produces ready-to-use official drafts (Namuna-9
// notices, ferfar entries, letters) in Marathi. Uses the configured chat
// provider. Never invents GR numbers, real names or dates not supplied.

import { getConfiguredChat } from "./provider";
import { DRAFT_TYPES } from "@/features/tools/draft-specs";

export async function generateDraft(typeKey: string, fields: Record<string, string>): Promise<string> {
  const spec = DRAFT_TYPES.find((t) => t.key === typeKey);
  if (!spec) throw new Error("Unknown draft type");

  const { provider, model } = await getConfiguredChat();

  const sys = `You draft official documents for a Maharashtra Talathi (village revenue officer).
Rules:
1. Produce a clean, ready-to-use OFFICIAL DRAFT in Marathi (Devanagari).
2. Use ONLY the details provided. Where a needed value is missing, insert a clear placeholder in square brackets like [दिनांक], [सही], [कार्यालय].
3. NEVER invent GR numbers, circular numbers, exact dates, or names that were not given.
4. Keep the standard official format and a respectful tone. Output only the draft — no explanation.

${spec.instruction}`;

  const details = Object.entries(fields)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const raw = await provider.chat(
    [
      { role: "system", content: sys },
      { role: "user", content: `Draft type: ${spec.en}\nDetails:\n${details || "(none provided — use placeholders)"}` },
    ],
    { model, temperature: 0.3 }
  );
  return raw.trim();
}
