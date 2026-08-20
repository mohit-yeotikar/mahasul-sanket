"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ingestDocumentText } from "@/lib/ai/ingest";

type Result = { ok: boolean; error?: string };

async function getActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id, role, district_id").eq("id", user.id).single();
  return profile;
}

/* ── DCO verifies (or rejects) a pending Talathi account ── */
export async function verifyUserAction(userId: string, approve: boolean): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!["dco", "district_admin", "state_admin", "super_admin"].includes(actor.role)) {
    return { ok: false, error: "Only DCO or Admin can verify accounts." };
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles").select("id, district_id, status").eq("id", userId).single();
  if (!target) return { ok: false, error: "User not found" };
  // District officers can only verify their own district
  if (["dco", "district_admin"].includes(actor.role) && target.district_id !== actor.district_id) {
    return { ok: false, error: "This user belongs to another district." };
  }

  const { error } = await admin.from("profiles").update({
    status: approve ? "active" : "rejected",
    verified_by: actor.id,
    verified_at: new Date().toISOString(),
  }).eq("id", userId);
  if (error) return { ok: false, error: "Update failed" };

  await admin.from("notifications").insert({
    user_id: userId,
    type: approve ? "account_verified" : "account_rejected",
    title: approve ? "तुमचे खाते सक्रिय झाले आहे ✅" : "तुमची नोंदणी नाकारण्यात आली",
    body: approve
      ? "आता तुम्ही महसूल संकेत AI सहाय्यक वापरू शकता."
      : "अधिक माहितीसाठी तुमच्या DCO शी संपर्क साधा.",
    link: "/dashboard",
  });
  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: approve ? "user.verified" : "user.rejected",
    entity: "profiles", entity_id: userId,
  });

  revalidatePath("/dco");
  return { ok: true };
}

/* ── Admin approves a knowledge proposal → becomes an FAQ document + AI knowledge ── */
export async function reviewProposalAction(
  proposalId: string,
  approve: boolean,
  note?: string
): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!["district_admin", "state_admin", "super_admin"].includes(actor.role)) {
    return { ok: false, error: "Only Admin can approve knowledge." };
  }

  const admin = createAdminClient();
  const { data: p } = await admin
    .from("knowledge_proposals").select("*").eq("id", proposalId).single();
  if (!p || p.status !== "proposed") return { ok: false, error: "Proposal not found or already reviewed." };

  if (!approve) {
    await admin.from("knowledge_proposals").update({
      status: "rejected", reviewed_by: actor.id, review_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", proposalId);
    revalidatePath("/admin");
    return { ok: true };
  }

  // Create an approved FAQ document and ingest it so the AI can use it
  const { data: doc, error: docErr } = await admin.from("documents").insert({
    title: p.question.slice(0, 280),
    doc_type: "faq",
    status: "approved",
    uploaded_by: p.proposed_by,
    approved_by: actor.id,
    summary: p.answer.slice(0, 500),
    tags: ["ticket-knowledge"],
  }).select("id").single();
  if (docErr || !doc) return { ok: false, error: "Could not create knowledge document" };

  try {
    await ingestDocumentText(doc.id, [
      { text: `प्रश्न / Question: ${p.question}\n\nअधिकृत उत्तर / Official answer: ${p.answer}`, page: null },
    ]);
    // ingest sets pending_approval; this one is already admin-approved
    await admin.from("documents").update({ status: "approved" }).eq("id", doc.id);
  } catch {
    return { ok: false, error: "Embedding failed — check AI provider key." };
  }

  await admin.from("knowledge_proposals").update({
    status: "approved", reviewed_by: actor.id, review_note: note ?? null,
    document_id: doc.id, reviewed_at: new Date().toISOString(),
  }).eq("id", proposalId);

  await admin.from("notifications").insert({
    user_id: p.proposed_by,
    type: "knowledge_approved",
    title: "तुमचा ज्ञान प्रस्ताव मंजूर झाला ✅",
    body: p.question.slice(0, 120),
    link: "/knowledge",
  });
  await admin.from("audit_logs").insert({
    actor_id: actor.id, action: "knowledge.approved",
    entity: "knowledge_proposals", entity_id: proposalId,
  });

  revalidatePath("/admin");
  return { ok: true };
}

/* ── Admin approves an uploaded document (makes it AI-searchable) ── */
export async function reviewDocumentAction(documentId: string, approve: boolean): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!["district_admin", "state_admin", "super_admin", "dco"].includes(actor.role)) {
    return { ok: false, error: "Forbidden" };
  }
  const admin = createAdminClient();
  const { error } = await admin.from("documents").update({
    status: approve ? "approved" : "rejected",
    approved_by: actor.id,
  }).eq("id", documentId).eq("status", "pending_approval");
  if (error) return { ok: false, error: "Update failed" };

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: approve ? "document.approved" : "document.rejected",
    entity: "documents", entity_id: documentId,
  });
  revalidatePath("/admin");
  return { ok: true };
}

/* ── Admin changes a user's role ── */
export async function setRoleAction(userId: string, role: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  const allowed = ["state_admin", "super_admin"].includes(actor.role)
    || (actor.role === "district_admin" && ["talathi", "circle_officer", "nayab_tahsildar"].includes(role));
  if (!allowed) return { ok: false, error: "You cannot assign this role." };

  const admin = createAdminClient();
  if (actor.role === "district_admin") {
    const { data: target } = await admin.from("profiles").select("district_id").eq("id", userId).single();
    if (target?.district_id !== actor.district_id) return { ok: false, error: "Other district." };
  }
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: "Update failed" };
  await admin.from("audit_logs").insert({
    actor_id: actor.id, action: "user.role_changed",
    entity: "profiles", entity_id: userId, detail: { role },
  });
  revalidatePath("/admin");
  revalidatePath("/users");
  return { ok: true };
}

/* ── Admin suspends / reactivates a user account ── */
export async function setUserStatusAction(userId: string, status: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!["district_admin", "state_admin", "super_admin"].includes(actor.role)) {
    return { ok: false, error: "Only Admin can change account status." };
  }
  if (!["active", "suspended"].includes(status)) return { ok: false, error: "Invalid status" };
  if (userId === actor.id) return { ok: false, error: "You cannot change your own status." };

  const admin = createAdminClient();
  if (actor.role === "district_admin") {
    const { data: target } = await admin.from("profiles").select("district_id").eq("id", userId).single();
    if (target?.district_id !== actor.district_id) return { ok: false, error: "Other district." };
  }
  const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
  if (error) return { ok: false, error: "Update failed" };
  await admin.from("audit_logs").insert({
    actor_id: actor.id, action: "user.status_changed",
    entity: "profiles", entity_id: userId, detail: { status },
  });
  revalidatePath("/users");
  return { ok: true };
}
