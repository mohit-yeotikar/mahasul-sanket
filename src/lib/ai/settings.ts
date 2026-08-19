// ============================================================
// Runtime AI settings — lets a Super/State Admin switch provider, model,
// temperature and the confidence threshold WITHOUT a redeploy.
//
// Source of truth: the `app_settings` row where key = 'ai'. To guarantee the
// LIVE deployment never changes behaviour until an admin *deliberately* saves,
// the DB values are honoured ONLY once the row has been admin-edited
// (`updated_by` is not null). Until then — and on any read failure — we fall
// back to the environment variables, i.e. exactly today's behaviour.
// ============================================================

import { createAdminClient } from "@/lib/supabase/server";

export interface AISettings {
  provider: string;
  chat_model: string;
  embedding_model: string;
  temperature: number;
  confidence_threshold: number;
}

export interface AISettingsInfo extends AISettings {
  /** true once a human admin has saved settings (row.updated_by is set). */
  configured: boolean;
  updated_at?: string | null;
}

/** Environment-derived defaults — the pre-existing, always-safe behaviour. */
export function envAISettings(): AISettings {
  return {
    provider: process.env.AI_PROVIDER ?? "gemini",
    chat_model: process.env.AI_CHAT_MODEL ?? "",
    embedding_model: process.env.AI_EMBEDDING_MODEL ?? "gemini-embedding-001",
    temperature: numOr(process.env.AI_TEMPERATURE, 0.2),
    confidence_threshold: numOr(process.env.AI_CONFIDENCE_THRESHOLD, 60),
  };
}

function numOr(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
function strOr(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

let cache: { at: number; val: AISettingsInfo } | null = null;
const TTL_MS = 30_000; // changes take effect within ~30s across instances

/**
 * Effective AI settings. Reads the admin-editable `ai` row, overlaying it on the
 * env defaults — but only when the row has been admin-configured. Cached for a
 * short TTL so we don't hit the DB on every answer.
 */
export async function getAISettings(force = false): Promise<AISettingsInfo> {
  const now = Date.now();
  if (!force && cache && now - cache.at < TTL_MS) return cache.val;

  const env = envAISettings();
  let val: AISettingsInfo = { ...env, configured: false, updated_at: null };

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("app_settings")
      .select("value, updated_by, updated_at")
      .eq("key", "ai")
      .single();

    if (data?.updated_by) {
      const v = (data.value ?? {}) as Record<string, unknown>;
      val = {
        provider: strOr(v.provider, env.provider),
        chat_model: strOr(v.chat_model, env.chat_model),
        embedding_model: strOr(v.embedding_model, env.embedding_model),
        temperature: numOr(v.temperature, env.temperature),
        confidence_threshold: numOr(v.confidence_threshold, env.confidence_threshold),
        configured: true,
        updated_at: (data.updated_at as string) ?? null,
      };
    }
  } catch {
    // Never break answering on a settings read failure — keep env defaults.
  }

  cache = { at: now, val };
  return val;
}

/** Invalidate the in-memory cache (call right after an admin saves). */
export function clearAISettingsCache() {
  cache = null;
}
