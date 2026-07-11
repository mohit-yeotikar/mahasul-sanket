// ============================================================
// AI Provider Adapter — THE swap point for moving to your own LLM.
//
// Every AI call in the app goes through `getAIProvider()`. To switch
// from Gemini to OpenRouter or a self-hosted model, change AI_PROVIDER
// in .env — no application code changes.
// ============================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProvider {
  chat(messages: ChatMessage[], opts?: { json?: boolean }): Promise<string>;
  embed(text: string): Promise<number[]>;
}

/* ── Google Gemini (free tier — prototype default) ── */
class GeminiProvider implements AIProvider {
  private key = process.env.GEMINI_API_KEY!;
  private chatModel = process.env.AI_CHAT_MODEL || "gemini-flash-latest";
  private embedModel = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-001";
  private base = "https://generativelanguage.googleapis.com/v1beta";

  // Backup models tried automatically when the primary is overloaded (503)
  // or rate-limited (429). Free-tier resilience: the user never sees a
  // transient provider hiccup.
  private fallbackModels = ["gemini-3-flash-preview", "gemini-flash-lite-latest"];

  async chat(messages: ChatMessage[], opts?: { json?: boolean }): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const body = (model: string) => ({
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: opts?.json ? "application/json" : "text/plain",
      },
      _model: model,
    });

    const models = [this.chatModel, ...this.fallbackModels.filter((m) => m !== this.chatModel)];
    let lastError = "";

    for (const model of models) {
      // Up to 2 attempts per model with a short pause between
      for (let attempt = 0; attempt < 2; attempt++) {
        const { _model, ...payload } = body(model);
        const res = await fetch(`${this.base}/models/${_model}:generateContent?key=${this.key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
          lastError = `Empty response from ${model}`;
          break; // empty result won't improve on retry — try next model
        }
        lastError = `Gemini chat failed (${model}): ${res.status} ${await res.text()}`;
        // Retry/fallback only for transient states; other errors are permanent
        if (res.status !== 429 && res.status !== 503) throw new Error(lastError);
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    throw new Error(lastError || "All Gemini models unavailable");
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.base}/models/${this.embedModel}:embedContent?key=${this.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 9000) }] },
        // DB schema uses vector(768); newer Gemini embedding models default
        // to larger sizes, so pin the output dimension explicitly.
        outputDimensionality: 768,
      }),
    });
    if (!res.ok) throw new Error(`Gemini embed failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.embedding.values as number[];
  }
}

/* ── OpenAI-compatible (OpenRouter today, YOUR OWN LLM tomorrow) ──
   Point AI_BASE_URL at any OpenAI-compatible server: OpenRouter,
   vLLM, Ollama, LM Studio, llama.cpp — this is the self-hosting path. */
class OpenAICompatibleProvider implements AIProvider {
  private base = process.env.AI_BASE_URL!;
  private key = process.env.AI_API_KEY ?? "";
  private chatModel = process.env.AI_CHAT_MODEL!;
  private embedModel = process.env.AI_EMBEDDING_MODEL!;

  async chat(messages: ChatMessage[], opts?: { json?: boolean }): Promise<string> {
    const res = await fetch(`${this.base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` },
      body: JSON.stringify({
        model: this.chatModel,
        messages,
        temperature: 0.2,
        response_format: opts?.json ? { type: "json_object" } : undefined,
      }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.base}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` },
      body: JSON.stringify({ model: this.embedModel, input: text.slice(0, 9000) }),
    });
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.data[0].embedding as number[];
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const provider = process.env.AI_PROVIDER ?? "gemini";
  switch (provider) {
    case "gemini":
      cached = new GeminiProvider();
      break;
    case "openrouter":
    case "selfhosted":
      cached = new OpenAICompatibleProvider();
      break;
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
  return cached;
}
