// Temporary diagnostic endpoint — verifies which AI provider production is
// using and (with ?test=1) that a live chat call succeeds. Redacts any
// secret-looking values so a misconfigured env var can't leak a key. This path
// is whitelisted in the middleware (PUBLIC_PATHS). Safe to delete after the demo.
// GET /api/health  or  /api/health?test=1
import { NextRequest, NextResponse } from "next/server";
import { getChatProvider } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KNOWN_PROVIDERS = ["gemini", "openrouter", "xai", "openai", "selfhosted", "grok-oauth"];

// Mask anything that looks like an API key/token so it never appears in output.
function redact(s: string): string {
  return s
    .replace(/gsk_[A-Za-z0-9]+/g, "gsk_***")
    .replace(/sk-[A-Za-z0-9-]+/g, "sk-***")
    .replace(/xai-[A-Za-z0-9-]+/g, "xai-***")
    .replace(/AIza[A-Za-z0-9_-]+/g, "AIza***")
    .replace(/eyJ[A-Za-z0-9._-]+/g, "eyJ***");
}

export async function GET(req: NextRequest) {
  const rawProvider = process.env.AI_PROVIDER ?? "gemini";
  const provider = KNOWN_PROVIDERS.includes(rawProvider)
    ? rawProvider
    : "INVALID — AI_PROVIDER must be one of: gemini | openrouter | xai | grok-oauth";

  const body: Record<string, unknown> = {
    provider,
    chatModel: process.env.AI_CHAT_MODEL ?? null,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
  };

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("grok_oauth_tokens")
      .select("id, access_token_expires_at")
      .eq("id", 1)
      .single();
    body.grokTokenPresent = !!data;
    body.grokTokenExpiresAt = data?.access_token_expires_at ?? null;
  } catch {
    body.grokTokenPresent = false;
  }

  if (new URL(req.url).searchParams.get("test") === "1") {
    try {
      const out = await getChatProvider().chat([{ role: "user", content: "Reply with the word OK" }]);
      body.chatTest = "ok";
      body.reply = out.slice(0, 40);
    } catch (e) {
      body.chatTest = "error";
      body.error = redact((e instanceof Error ? e.message : String(e)).slice(0, 300));
    }
  }

  return NextResponse.json(body);
}
