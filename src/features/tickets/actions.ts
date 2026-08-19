"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NEXT_LEVEL, ROLE_LEVEL, type EscalationLevel } from "@/types";

type Result = { ok: boolean; error?: string; id?: string };

async function getActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, district_id, taluka_id, full_name")
    .eq("id", user.id)
    .single();
  return profile ? { supabase, profile } : null;
}

async function notify(
  userIds: string[],
  type: string,
  title: string,
  body: string,
  ticketId: string
) {
  const admin = createAdminClient();
  const unique = [...new Set(userIds)].filter(Boolean);
  if (!unique.length) return;
  await admin.from("notifications").insert(
    unique.map((user_id) => ({
      user_id, type, title, body,
      link: `/tickets/${ticketId}`,
      ticket_id: ticketId,
    }))
  );
}

/** Everyone in this ticket's escalation chain: creator + officers at each level of its district. */
async function chainUserIds(ticketId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: t } = await admin
    .from("tickets").select("created_by, district_id").eq("id", ticketId).single();
  if (!t) return [];
  const { data: officers } = await admin
    .from("profiles")
    .select("id")
    .eq("district_id", t.district_id)
    .in("role", ["nayab_tahsildar", "dco", "district_admin"])
    .eq("status", "active");
  return [t.created_by, ...(officers ?? []).map((o) => o.id)];
}

/* ── Create ticket (Talathi, often from a low-confidence AI answer) ── */
const createSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  sourceQuestion: z.string().max(4000).optional(),
  aiAnswerDraft: z.string().max(5000).optional(),
  aiConfidence: z.coerce.number().min(0).max(100).optional(),
});

export async function createTicketAction(input: unknown): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  if (!actor.profile.district_id) return { ok: false, error: "Your profile has no district set." };

  const d = parsed.data;
  const { data: ticket, error } = await actor.supabase
    .from("tickets")
    .insert({
      subject: d.subject,
      description: d.description,
      category: d.category,
      priority: d.priority,
      created_by: actor.profile.id,
      district_id: actor.profile.district_id,
      taluka_id: actor.profile.taluka_id,
      source_question: d.sourceQuestion || null,
      ai_answer_draft: d.aiAnswerDraft || null,
      ai_confidence: d.aiConfidence ?? null,
      current_level: "L2", // starts with Nayab Tahsildar
    })
    .select("id, ticket_number")
    .single();
  if (error || !ticket) return { ok: false, error: "Could not create ticket" };

  // Notify district L2 officers (and DCO for visibility)
  const admin = createAdminClient();
  const { data: officers } = await admin
    .from("profiles").select("id")
    .eq("district_id", actor.profile.district_id)
    .in("role", ["nayab_tahsildar", "dco"])
    .eq("status", "active");
  await notify(
    (officers ?? []).map((o) => o.id),
    "ticket_created",
    `नवीन तिकीट ${ticket.ticket_number}`,
    d.subject,
    ticket.id
  );

  await admin.from("ticket_events").insert({
    ticket_id: ticket.id, actor_id: actor.profile.id,
    event_type: "created", new_value: "open",
  });

  revalidatePath("/tickets");
  return { ok: true, id: ticket.id };
}

/* ── Reply ── */
const replySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
});

export async function replyAction(input: unknown): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { ticketId, body, isInternal } = parsed.data;

  const { error } = await actor.supabase.from("ticket_replies").insert({
    ticket_id: ticketId,
    author_id: actor.profile.id,
    body,
    is_internal: !!isInternal,
  });
  if (error) return { ok: false, error: "Reply failed (no access?)" };

  // Move open → in_progress when an officer replies
  const isOfficer = ["nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"]
    .includes(actor.profile.role);
  if (isOfficer && !isInternal) {
    await actor.supabase.from("tickets")
      .update({ status: "in_progress" })
      .eq("id", ticketId)
      .in("status", ["open", "assigned"]);
  }

  if (!isInternal) {
    const admin = createAdminClient();
    const { data: t } = await admin
      .from("tickets").select("created_by, ticket_number").eq("id", ticketId).single();
    if (t && t.created_by !== actor.profile.id) {
      await notify([t.created_by], "ticket_replied",
        `तिकीट ${t.ticket_number} — नवीन उत्तर`, body.slice(0, 120), ticketId);
    }
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

/* ── Escalate (creator, if unsatisfied) L2 → L3 → L4 ── */
export async function escalateAction(ticketId: string, reason: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const { data: t } = await actor.supabase
    .from("tickets")
    .select("id, created_by, current_level, ticket_number, district_id")
    .eq("id", ticketId)
    .single();
  if (!t) return { ok: false, error: "Ticket not found" };
  if (t.created_by !== actor.profile.id) return { ok: false, error: "Only the ticket creator can escalate." };

  const next = NEXT_LEVEL[t.current_level as EscalationLevel];
  if (!next) return { ok: false, error: "Already at the highest level (L4)." };

  const admin = createAdminClient();
  await admin.from("tickets")
    .update({ current_level: next, status: "reopened", assigned_to: null })
    .eq("id", ticketId);
  await admin.from("ticket_escalations").insert({
    ticket_id: ticketId,
    from_level: t.current_level,
    to_level: next,
    escalated_by: actor.profile.id,
    reason: reason || null,
  });
  await admin.from("ticket_events").insert({
    ticket_id: ticketId, actor_id: actor.profile.id,
    event_type: "escalated", old_value: t.current_level, new_value: next,
  });

  // Notify officers at the new level in this district
  const roleAtLevel: Record<string, string> = { L2: "nayab_tahsildar", L3: "dco", L4: "district_admin" };
  const { data: officers } = await admin
    .from("profiles").select("id")
    .eq("district_id", t.district_id)
    .eq("role", roleAtLevel[next])
    .eq("status", "active");
  await notify((officers ?? []).map((o) => o.id), "ticket_escalated",
    `तिकीट ${t.ticket_number} — ${next} स्तरावर वर्ग`, reason.slice(0, 120), ticketId);

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

/* ── Set SLA days (L2+ only). L4 setting time notifies the whole chain.
   Power separation: each level can only promise what it can deliver —
   L2 up to 14 days, L3 up to 30, L4+ up to 90. ── */
const SLA_CAP: Record<string, number> = {
  nayab_tahsildar: 14,
  dco: 30,
  district_admin: 90,
  state_admin: 90,
  super_admin: 90,
};

export async function setSlaAction(ticketId: string, days: number): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  const level = ROLE_LEVEL[actor.profile.role as import("@/types").UserRole];
  const cap = SLA_CAP[actor.profile.role];
  if (!cap) return { ok: false, error: "Only L2 and above can set resolution time." };
  if (!Number.isInteger(days) || days < 1 || days > cap) {
    return {
      ok: false,
      error: `Your level can promise 1–${cap} days. For longer, escalate to a higher level.`,
    };
  }

  const admin = createAdminClient();
  const { data: t } = await admin
    .from("tickets").select("id, created_by, ticket_number").eq("id", ticketId).single();
  if (!t) return { ok: false, error: "Ticket not found" };

  const setterLevel = level ?? "L4";
  const { error } = await admin.from("tickets").update({
    sla_days: days,
    sla_set_by: actor.profile.id,
    sla_set_by_level: setterLevel,
  }).eq("id", ticketId);
  if (error) return { ok: false, error: "Could not set resolution time" };

  await admin.from("ticket_events").insert({
    ticket_id: ticketId, actor_id: actor.profile.id,
    event_type: "sla_set", new_value: `${days} days (${setterLevel})`,
  });

  const title = `तिकीट ${t.ticket_number} — निराकरण कालावधी: ${days} दिवस`;
  const body = `${setterLevel} स्तरावरील अधिकाऱ्याने ${days} दिवसांचा कालावधी निश्चित केला आहे.`;
  if (setterLevel === "L4") {
    // L4 sets time → everyone in the escalation chain is notified
    await notify(await chainUserIds(ticketId), "ticket_sla_set", title, body, ticketId);
  } else {
    await notify([t.created_by], "ticket_sla_set", title, body, ticketId);
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

/* ── Status changes ── */
export async function setStatusAction(
  ticketId: string,
  status: "resolved" | "closed" | "reopened" | "in_progress" | "waiting"
): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const patch: Record<string, unknown> = { status };
  if (status === "resolved") patch.resolved_at = new Date().toISOString();
  if (status === "closed") patch.closed_at = new Date().toISOString();

  const { data: updated, error } = await actor.supabase
    .from("tickets").update(patch).eq("id", ticketId)
    .select("id, created_by, ticket_number").single();
  if (error || !updated) return { ok: false, error: "Update failed (no access?)" };

  const admin = createAdminClient();
  await admin.from("ticket_events").insert({
    ticket_id: ticketId, actor_id: actor.profile.id,
    event_type: "status_changed", new_value: status,
  });
  if (status === "resolved" && updated.created_by !== actor.profile.id) {
    await notify([updated.created_by], "ticket_resolved",
      `तिकीट ${updated.ticket_number} — निराकरण झाले`,
      "उत्तर समाधानकारक नसल्यास तुम्ही वरिष्ठ स्तरावर पाठवू शकता.", ticketId);
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

/* ── Propose generic Q&A as knowledge (DCO / L2) → Admin approval ── */
export async function proposeKnowledgeAction(
  ticketId: string,
  question: string,
  answer: string
): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!["dco", "nayab_tahsildar"].includes(actor.profile.role)) {
    return { ok: false, error: "Only DCO / Nayab Tahsildar can propose knowledge." };
  }
  if (question.trim().length < 10 || answer.trim().length < 10) {
    return { ok: false, error: "Question and answer are too short." };
  }

  const { error } = await actor.supabase.from("knowledge_proposals").insert({
    ticket_id: ticketId,
    question: question.trim(),
    answer: answer.trim(),
    proposed_by: actor.profile.id,
  });
  if (error) return { ok: false, error: "Could not create proposal" };

  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles").select("id")
    .in("role", ["district_admin", "state_admin"])
    .eq("status", "active");
  await notify((admins ?? []).map((a) => a.id), "knowledge_proposed",
    "नवीन ज्ञान प्रस्ताव मंजुरीच्या प्रतीक्षेत", question.slice(0, 120), ticketId);

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

/* ── Apply AI triage suggestion (L2+ officer): set category + priority ── */
const CATEGORIES = [
  "mutation", "seven_twelve", "ferfar", "crop_entry", "inheritance",
  "revenue", "survey", "map", "certificates", "digital_signature",
  "technical_issue", "others",
];
const PRIORITIES = ["low", "medium", "high", "critical"];

export async function applyTriageAction(
  ticketId: string,
  category: string,
  priority: string
): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!["nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"].includes(actor.profile.role)) {
    return { ok: false, error: "Only L2+ officers can triage tickets." };
  }
  if (!CATEGORIES.includes(category) || !PRIORITIES.includes(priority)) {
    return { ok: false, error: "Invalid category or priority." };
  }

  const { error } = await actor.supabase
    .from("tickets")
    .update({ category, priority })
    .eq("id", ticketId)
    .select("id")
    .single();
  if (error) return { ok: false, error: "Update failed (no access?)" };

  const admin = createAdminClient();
  await admin.from("ticket_events").insert({
    ticket_id: ticketId, actor_id: actor.profile.id,
    event_type: "triage_applied", new_value: `${category} / ${priority}`,
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}
