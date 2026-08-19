"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Supabase Auth is email-based; we map mobile numbers to a synthetic
// internal email. Users only ever see/type their mobile number.
// Swapping to real SMS OTP later touches only this file.
const mobileToEmail = (mobile: string) => `${mobile}@user.mahasulsanket.in`;

const registerSchema = z
  .object({
    fullName: z.string().min(3).max(100),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
    governmentId: z.string().min(4).max(40),
    districtId: z.string().uuid(),
    talukaId: z.string().uuid().optional().or(z.literal("")),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ActionResult = { ok: boolean; error?: string };

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const admin = createAdminClient();

  // Create the auth user (service role: no email confirmation needed —
  // the real gate is DCO verification of the Government ID).
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: mobileToEmail(d.mobile),
    password: d.password,
    email_confirm: true,
    user_metadata: { mobile: d.mobile, full_name: d.fullName },
  });
  if (authErr || !created.user) {
    return {
      ok: false,
      error: authErr?.message.includes("already")
        ? "This mobile number is already registered."
        : authErr?.message ?? "Registration failed",
    };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: d.fullName,
    mobile: d.mobile,
    government_id: d.governmentId,
    role: "talathi",
    status: "pending_verification",
    district_id: d.districtId,
    taluka_id: d.talukaId || null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id); // rollback
    return { ok: false, error: "Could not create profile. Try again." };
  }

  await admin.from("audit_logs").insert({
    actor_id: created.user.id,
    action: "user.registered",
    entity: "profiles",
    entity_id: created.user.id,
    detail: { district_id: d.districtId },
  });

  return { ok: true };
}

// ── Citizen self-registration ──
// Ordinary people (not government staff) register without a Government ID
// and are activated immediately — there is nothing for a DCO to verify.
// They get the limited citizen feature set (AI chat, info feed, area
// officer directory, Seva links). District/Taluka are captured so we can
// show them the right area officers.
const citizenSchema = z
  .object({
    fullName: z.string().min(3).max(100),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
    districtId: z.string().uuid(),
    talukaId: z.string().uuid().optional().or(z.literal("")),
    password: z.string().min(8).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerCitizenAction(input: unknown): Promise<ActionResult> {
  const parsed = citizenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const admin = createAdminClient();

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: mobileToEmail(d.mobile),
    password: d.password,
    email_confirm: true,
    user_metadata: { mobile: d.mobile, full_name: d.fullName },
  });
  if (authErr || !created.user) {
    return {
      ok: false,
      error: authErr?.message.includes("already")
        ? "This mobile number is already registered."
        : authErr?.message ?? "Registration failed",
    };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: d.fullName,
    mobile: d.mobile,
    government_id: "CITIZEN", // citizens have no Sevarth/employee ID
    role: "citizen",
    status: "active", // no DCO verification needed
    district_id: d.districtId,
    taluka_id: d.talukaId || null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id); // rollback
    return { ok: false, error: "Could not create profile. Try again." };
  }

  await admin.from("audit_logs").insert({
    actor_id: created.user.id,
    action: "citizen.registered",
    entity: "profiles",
    entity_id: created.user.id,
    detail: { district_id: d.districtId },
  });

  return { ok: true };
}

const loginSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  password: z.string().min(1),
});

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid mobile number and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: mobileToEmail(parsed.data.mobile),
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: "Incorrect mobile number or password." };
  return { ok: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
