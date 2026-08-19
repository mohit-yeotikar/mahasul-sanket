// One-time SuperGrok OAuth login (OAuth 2.0 device-code + PKCE-free public
// client). Signs in with your SuperGrok / X Premium+ subscription and stores
// the REFRESH TOKEN in Supabase, so the Vercel app can mint Grok access
// tokens on demand — working from ANY device, with NO per-token API key.
//
// Prereqs:
//   1. Run migration supabase/migrations/0013_grok_oauth.sql in Supabase.
//   2. .env.local must have NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
//
// Run:  node scripts/grok-login.mjs
//
// After it prints "OK", set on Vercel:  AI_PROVIDER=grok-oauth  and redeploy.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ── env loader (same as the other scripts) ──
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

// xAI's PUBLIC desktop/CLI OAuth client — no secret (verified against
// https://auth.x.ai/.well-known/openid-configuration and open-source clients).
const CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
const SCOPE = "openid profile email offline_access grok-cli:access api:access";
const DISCOVERY = "https://auth.x.ai/.well-known/openid-configuration";
const API_BASE = "https://api.x.ai/v1";

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const form = (o) => new URLSearchParams(o);

async function main() {
  // 0. Discover the real endpoints (resilient to future changes).
  const disc = await (await fetch(DISCOVERY)).json();
  const deviceEndpoint = disc.device_authorization_endpoint;
  const tokenEndpoint = disc.token_endpoint;
  if (!deviceEndpoint || !tokenEndpoint) throw new Error("xAI OIDC discovery missing device/token endpoints.");

  // 1. Request a device code.
  const dcRes = await fetch(deviceEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({ client_id: CLIENT_ID, scope: SCOPE }),
  });
  if (!dcRes.ok) throw new Error(`Device-code request failed: ${dcRes.status} ${await dcRes.text()}`);
  const dc = await dcRes.json();

  console.log("\n──────────────────────────────────────────────");
  console.log("  Sign in to xAI (SuperGrok) to authorise this app");
  console.log("──────────────────────────────────────────────\n");
  console.log(`  1. Open:  ${dc.verification_uri_complete || dc.verification_uri}`);
  if (!dc.verification_uri_complete) console.log(`  2. Enter code:  ${dc.user_code}`);
  console.log("\n  Waiting for approval…\n");

  // 2. Poll the token endpoint until the user approves.
  let interval = (dc.interval || 5) * 1000;
  const deadline = Date.now() + (dc.expires_in || 600) * 1000;
  let tokens;
  while (Date.now() < deadline) {
    await sleep(interval);
    const tRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        client_id: CLIENT_ID,
        device_code: dc.device_code,
      }),
    });
    const tj = await tRes.json().catch(() => ({}));
    if (tRes.ok && tj.access_token) { tokens = tj; break; }
    if (tj.error === "authorization_pending") continue;
    if (tj.error === "slow_down") { interval += 5000; continue; }
    throw new Error(`Token poll failed: ${tj.error || tRes.status} ${tj.error_description || ""}`);
  }
  if (!tokens) throw new Error("Timed out waiting for approval. Run the script again.");
  if (!tokens.refresh_token) {
    throw new Error("No refresh_token returned — the offline_access scope was declined. Re-run and approve all permissions.");
  }

  // 3. Store the tokens in Supabase (service-role only table).
  const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
  const { error } = await db.from("grok_oauth_tokens").upsert({
    id: 1,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    access_token_expires_at: expiresAt,
    scope: tokens.scope ?? SCOPE,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not store tokens (did you run migration 0013_grok_oauth.sql?): ${error.message}`);
  console.log("  ✅ Signed in — refresh token stored in Supabase.\n");

  // 4. Verify Grok actually answers, so you KNOW it works before the demo.
  const model = env.AI_CHAT_MODEL || "grok-4";
  console.log(`  Testing a live Grok call with model "${model}"…`);
  const test = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.access_token}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with the single word: OK" }],
      max_tokens: 5,
    }),
  });
  if (test.ok) {
    const tj = await test.json();
    console.log(`  ✅ Grok replied: "${tj.choices?.[0]?.message?.content?.trim()}"\n`);
    console.log("  ────────────────────────────────────────────");
    console.log("  Now set these on Vercel (Settings → Environment Variables):");
    console.log("     AI_PROVIDER=grok-oauth");
    console.log(`     AI_CHAT_MODEL=${model}`);
    console.log("  (keep GEMINI_API_KEY — embeddings still use it) then Redeploy.");
    console.log("  ────────────────────────────────────────────\n");
  } else {
    console.log(`  ⚠ Test call failed (${test.status}): ${await test.text()}`);
    const mRes = await fetch(`${API_BASE}/models`, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (mRes.ok) {
      const m = await mRes.json();
      const ids = (m.data || []).map((x) => x.id).join(", ");
      console.log(`\n  Models your account can use: ${ids}`);
      console.log("  Set AI_CHAT_MODEL (in .env.local and Vercel) to one of these and re-run.\n");
    }
  }
}

main().catch((e) => { console.error("\nGrok login FAILED:", e.message); process.exit(1); });
