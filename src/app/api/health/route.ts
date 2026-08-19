// Temporary diagnostic endpoint — verifies which AI provider production is
// using and (with ?test=1) that a live chat call succeeds. Exposes NO secrets,
// only booleans + the public provider/model names. This path is whitelisted in
// the middleware (PUBLIC_PATHS), so it's reachable without login. Safe to delete
// after the demo. GET /api/health  or  /api/health?test=1
import { NextRequest, NextResponse } from "next/server";
import { getChatProvider } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const body: Record<string, unknown> = {
    provider: process.env.AI_PROVIDER ?? "gemini",
    chatModel: process.env.AI_CHAT_MODEL ?? null,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
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
      body.error = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    }
  }

  return NextResponse.json(body);
}
