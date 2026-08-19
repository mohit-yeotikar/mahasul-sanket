"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["received", "in_review", "resolved", "closed"];

// Officer updates a grievance's status / adds a note. RLS (grievances_officer_update)
// ensures only an in-scope officer of the grievance's district can do this.
export async function updateGrievanceAction(
  id: string,
  status: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status" };

  const { error } = await supabase
    .from("grievances")
    .update({ status, officer_note: note.trim() || null })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { ok: false, error: "Update failed (no access?)" };

  revalidatePath("/grievances");
  return { ok: true };
}
