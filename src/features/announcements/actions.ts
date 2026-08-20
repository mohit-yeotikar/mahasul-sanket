"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

async function getActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id, role, district_id").eq("id", user.id).single();
  return profile;
}

const ADMINS = ["district_admin", "state_admin", "super_admin"];
const schema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(5).max(2000),
  scope: z.enum(["district", "state"]),
});

export async function postAnnouncementAction(input: unknown): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!ADMINS.includes(actor.role)) return { ok: false, error: "Only Admin can post announcements." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  let district_id: string | null;
  if (parsed.data.scope === "state") {
    if (actor.role === "district_admin") return { ok: false, error: "Only State/Super Admin can post state-wide." };
    district_id = null;
  } else {
    if (!actor.district_id) return { ok: false, error: "Your account has no district set." };
    district_id = actor.district_id;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    district_id,
    created_by: actor.id,
  });
  if (error) return { ok: false, error: "Could not post announcement (migration 0016 run?)." };

  await admin.from("audit_logs").insert({
    actor_id: actor.id, action: "announcement.posted",
    entity: "announcements", detail: { scope: parsed.data.scope },
  });
  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!ADMINS.includes(actor.role)) return { ok: false, error: "Forbidden" };

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, error: "Delete failed" };
  await admin.from("audit_logs").insert({
    actor_id: actor.id, action: "announcement.deleted", entity: "announcements", entity_id: id,
  });
  revalidatePath("/announcements");
  return { ok: true };
}
