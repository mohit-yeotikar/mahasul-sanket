import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAISettings, envAISettings, clearAISettingsCache } from "@/lib/ai/settings";
import { pingChat } from "@/lib/ai/provider";

// Providers the app knows how to build (see provider.ts#build).
const PROVIDERS = ["grok-oauth", "gemini", "openrouter", "xai", "openai", "selfhosted"] as const;

const putSchema = z.object({
  provider: z.enum(PROVIDERS),
  chat_model: z.string().trim().max(120),
  temperature: z.number().min(0).max(2),
  confidence_threshold: z.number().int().min(0).max(100),
});

const testSchema = z.object({
  action: z.literal("test"),
  provider: z.enum(PROVIDERS),
  chat_model: z.string().trim().max(120).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/** Only State/Super Admin may view or change AI settings. */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: me } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!me || !["state_admin", "super_admin"].includes(me.role)) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { user, role: me.role, name: me.full_name as string };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const settings = await getAISettings(true);
  return NextResponse.json({
    settings,
    env: envAISettings(),
    providers: PROVIDERS,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = testSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const reply = await pingChat(parsed.data.provider, parsed.data.chat_model, parsed.data.temperature);
    return NextResponse.json({ ok: true, reply: reply.slice(0, 200) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Test failed" });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", detail: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  // Preserve the pinned embedding model — changing it would invalidate every
  // already-ingested vector, so it is not editable from the UI.
  const env = envAISettings();
  const value = {
    provider: parsed.data.provider,
    chat_model: parsed.data.chat_model,
    embedding_model: env.embedding_model,
    temperature: parsed.data.temperature,
    confidence_threshold: parsed.data.confidence_threshold,
  };

  const { error } = await admin
    .from("app_settings")
    .update({ value, updated_by: auth.user.id, updated_at: new Date().toISOString() })
    .eq("key", "ai");
  if (error) return NextResponse.json({ error: "Could not save settings" }, { status: 500 });

  clearAISettingsCache();

  await admin.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "ai_settings.updated",
    entity: "app_settings",
    entity_id: "ai",
    detail: value,
  });

  const settings = await getAISettings(true);
  return NextResponse.json({ settings });
}
