import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { FEATURE_FLAGS, getFeatureFlags, clearFeatureFlagsCache } from "@/lib/feature-flags";

async function requireSuper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || me.role !== "super_admin") return { error: "Forbidden", status: 403 as const };
  return { user };
}

export async function GET() {
  const auth = await requireSuper();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ flags: await getFeatureFlags(true), defs: FEATURE_FLAGS });
}

export async function PUT(req: NextRequest) {
  const auth = await requireSuper();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = z.object({ flags: z.record(z.string(), z.boolean()) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Keep only known flags.
  const value: Record<string, boolean> = {};
  for (const f of FEATURE_FLAGS) value[f.key] = parsed.data.flags[f.key] ?? f.def;

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .upsert({ key: "feature_flags", value, updated_by: auth.user.id, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: "Could not save flags" }, { status: 500 });

  clearFeatureFlagsCache();
  await admin.from("audit_logs").insert({ actor_id: auth.user.id, action: "feature_flags.updated", entity: "app_settings", entity_id: "feature_flags", detail: value });
  return NextResponse.json({ flags: value });
}
