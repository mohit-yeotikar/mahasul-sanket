// Reset a user's login password directly via the Supabase Auth admin API.
//
// WHY THIS EXISTS: passwords live in Supabase Auth, NOT in this repo, and
// accounts use a synthetic email (<mobile>@user.mahasulsanket.in) that cannot
// receive a recovery mail. So a forgotten super_admin / DCO / state_admin
// login can only be recovered with the service_role key — that is this script.
//
// Usage:
//   node scripts/reset-password.mjs --list                  # list privileged accounts + their mobiles
//   node scripts/reset-password.mjs <mobile> <newPassword>  # set a new password for that mobile
//
// Example:
//   node scripts/reset-password.mjs 9000000007 NewPass@2026
//
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ── env (same loader as seed-demo.mjs) ──
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const mail = (m) => `${m}@user.mahasulsanket.in`;
const PRIVILEGED = ["super_admin", "state_admin", "district_admin", "dco"];

async function allAuthUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function main() {
  const [arg1, arg2] = process.argv.slice(2);

  // ── list mode: show the privileged accounts and their login mobiles ──
  if (!arg1 || arg1 === "--list") {
    const { data: profs, error } = await db
      .from("profiles")
      .select("mobile, full_name, role, status")
      .in("role", PRIVILEGED)
      .order("role", { ascending: true });
    if (error) throw error;

    console.log("\nPrivileged accounts — reset any with:");
    console.log("  node scripts/reset-password.mjs <mobile> <newPassword>\n");
    console.log("  MOBILE       ROLE             STATUS                 NAME");
    console.log("  " + "-".repeat(74));
    for (const p of profs ?? [])
      console.log(`  ${String(p.mobile).padEnd(12)} ${String(p.role).padEnd(16)} ${String(p.status).padEnd(22)} ${p.full_name}`);
    if (!profs?.length) console.log("  (no super_admin / DCO accounts found in the profiles table)");
    console.log("");
    return;
  }

  // ── reset mode ──
  const mobile = arg1;
  const newPassword = arg2;
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    console.error("Mobile must be 10 digits starting with 6–9. Run with --list to see accounts.");
    process.exit(1);
  }
  if (!newPassword || newPassword.length < 8) {
    console.error("New password must be at least 8 characters.");
    process.exit(1);
  }

  const user = (await allAuthUsers()).find((u) => u.email === mail(mobile));
  if (!user) {
    console.error(`No auth user found for mobile ${mobile}. Run with --list to see valid mobiles.`);
    process.exit(1);
  }

  const { error: pwErr } = await db.auth.admin.updateUserById(user.id, { password: newPassword });
  if (pwErr) {
    console.error("Password reset failed:", pwErr.message);
    process.exit(1);
  }

  // Ensure the recovered account is actually able to log in (not left pending/suspended).
  await db.from("profiles").update({ status: "active" }).eq("id", user.id);

  const { data: prof } = await db
    .from("profiles").select("full_name, role").eq("id", user.id).single();

  console.log(`\n✅ Password reset for ${mobile} — ${prof?.full_name ?? "?"} (${prof?.role ?? "?"}).`);
  console.log(`   Log in at /login with mobile ${mobile} and the new password.\n`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
