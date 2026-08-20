// L6 feature flags — runtime on/off switches stored in app_settings (key
// 'feature_flags'), toggled by the Super Admin with no redeploy. 30s TTL cache.

import { createAdminClient } from "@/lib/supabase/server";

export const FEATURE_FLAGS = [
  { key: "public_chat", mr: "सार्वजनिक AI चॅट", en: "Public AI chat", def: true },
  { key: "citizen_tools", mr: "नागरिक साधने", en: "Citizen tools", def: true },
  { key: "grievances", mr: "तक्रार नोंदणी", en: "Grievance submission", def: true },
  { key: "draft_generator", mr: "मसुदा जनरेटर", en: "Draft generator", def: true },
  { key: "voice_input", mr: "आवाज इनपुट", en: "Voice input", def: true },
  { key: "pdf_ocr", mr: "स्कॅन-PDF OCR", en: "Scanned-PDF OCR", def: true },
] as const;

export type FlagKey = (typeof FEATURE_FLAGS)[number]["key"];

function defaults(): Record<string, boolean> {
  return Object.fromEntries(FEATURE_FLAGS.map((f) => [f.key, f.def]));
}

let cache: { at: number; val: Record<string, boolean> } | null = null;
const TTL = 30_000;

export async function getFeatureFlags(force = false): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (!force && cache && now - cache.at < TTL) return cache.val;
  const val = defaults();
  try {
    const db = createAdminClient();
    const { data } = await db.from("app_settings").select("value").eq("key", "feature_flags").maybeSingle();
    const v = data?.value as Record<string, unknown> | null;
    if (v && typeof v === "object") {
      for (const f of FEATURE_FLAGS) if (typeof v[f.key] === "boolean") val[f.key] = v[f.key] as boolean;
    }
  } catch {
    // fall back to defaults
  }
  cache = { at: now, val };
  return val;
}

export async function isFeatureEnabled(key: FlagKey): Promise<boolean> {
  return (await getFeatureFlags())[key] ?? true;
}

export function clearFeatureFlagsCache() {
  cache = null;
}
