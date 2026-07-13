// Fallback OCR for scanned PDFs / images via Gemini's multimodal vision.
// Used when a document has no extractable text layer (scanned GRs). Gemini
// reads Marathi (Devanagari) + English well and runs server-side (Vercel-safe).

const PROMPT =
  "You are an OCR engine for Government of Maharashtra documents. Transcribe ALL text visible in this document EXACTLY as written, preserving the original language (Marathi/Devanagari and English) and the line/paragraph order. Do not translate, summarise, correct, or add any commentary — output only the transcribed text.";

function ocrModels(): string[] {
  const primary = process.env.AI_OCR_MODEL || process.env.AI_CHAT_MODEL || "gemini-flash-latest";
  return [primary, "gemini-flash-latest", "gemini-flash-lite-latest"].filter(
    (m, i, a) => a.indexOf(m) === i
  );
}

/** Transcribe a scanned PDF/image. Returns "" if OCR is unavailable/too large. */
export async function geminiOcr(bytes: ArrayBuffer, mimeType: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return "";

  const data = Buffer.from(bytes).toString("base64");
  // Inline data has a ~20 MB request cap; base64 inflates ~33%.
  if (data.length > 18 * 1024 * 1024) return "";

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType || "application/pdf", data } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 8192 },
  };

  for (const model of ocrModels()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!res.ok) {
        if (res.status === 429 || res.status === 503) continue; // transient — try next model
        return "";
      }
      const d = await res.json();
      const text: string =
        d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      if (text.trim()) return text.trim();
    } catch {
      /* try next model */
    }
  }
  return "";
}
