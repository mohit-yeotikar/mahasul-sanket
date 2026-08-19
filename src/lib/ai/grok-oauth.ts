// ============================================================
// Grok via SuperGrok OAuth — server-side provider.
//
// Instead of a per-token API key, this reuses your SuperGrok / X Premium+
// subscription. A one-time local login (scripts/grok-login.mjs) stores a
// REFRESH TOKEN in Supabase; here on the server we exchange it for short-lived
// ACCESS TOKENS as needed and call the OpenAI-compatible xAI endpoint. Because
// the refresh token lives in Supabase (not on any one machine), this works on
// Vercel from every device.
// ============================================================

import type { AIProvider, ChatMessage } from "./provider";
import { createAdminClient } from "@/lib/supabase/server";

// Verified against https://auth.x.ai/.well-known/openid-configuration.
const TOKEN_ENDPOINT = "https://auth.x.ai/oauth2/token";
const CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828"; // xAI public CLI client (no secret)
const API_BASE = process.env.AI_BASE_URL || "https://api.x.ai/v1";

// In-memory cache so we don't hit Supabase / the token endpoint on every call.
// (Per serverless instance; harmless if several instances refresh independently.)
let cachedAccess: { token: string; expiresAt: number } | null = null;

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Grok token refresh failed (${res.status}). The SuperGrok login may have expired — ` +
        `re-run \`node scripts/grok-login.mjs\`. Details: ${await res.text()}`
    );
  }
  const j = await res.json();
  return {
    access: j.access_token as string,
    // xAI may rotate the refresh token — persist whatever we get back.
    refresh: (j.refresh_token as string) ?? refreshToken,
    expiresIn: (j.expires_in as number) ?? 3600,
  };
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccess && cachedAccess.expiresAt - 60_000 > now) return cachedAccess.token;

  const db = createAdminClient();
  const { data, error } = await db
    .from("grok_oauth_tokens")
    .select("refresh_token, access_token, access_token_expires_at")
    .eq("id", 1)
    .single();

  if (error || !data?.refresh_token) {
    throw new Error(
      "Grok OAuth is not set up. Run `node scripts/grok-login.mjs` to sign in with your SuperGrok subscription."
    );
  }

  // Reuse the stored access token if it's still valid.
  const storedExp = data.access_token_expires_at ? new Date(data.access_token_expires_at).getTime() : 0;
  if (data.access_token && storedExp - 60_000 > now) {
    cachedAccess = { token: data.access_token, expiresAt: storedExp };
    return data.access_token;
  }

  // Otherwise refresh and persist the new tokens.
  const { access, refresh, expiresIn } = await refreshAccessToken(data.refresh_token);
  const expiresAt = now + expiresIn * 1000;
  await db
    .from("grok_oauth_tokens")
    .update({
      access_token: access,
      access_token_expires_at: new Date(expiresAt).toISOString(),
      refresh_token: refresh,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  cachedAccess = { token: access, expiresAt };
  return access;
}

export class GrokOAuthProvider implements AIProvider {
  private model = process.env.AI_CHAT_MODEL || "grok-4";

  async chat(messages: ChatMessage[], opts?: { json?: boolean }): Promise<string> {
    const token = await getAccessToken();
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        response_format: opts?.json ? { type: "json_object" } : undefined,
      }),
    });
    if (!res.ok) throw new Error(`Grok chat failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async embed(): Promise<number[]> {
    // Embeddings intentionally stay on Gemini (getEmbedProvider) so the vector
    // space of already-ingested documents never changes.
    throw new Error("GrokOAuthProvider does not provide embeddings — use Gemini for embeddings.");
  }
}
