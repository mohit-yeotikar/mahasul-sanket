// Cross-level sync audit: signs in as each demo user and runs the SAME
// queries their dashboard runs (under their RLS permissions), then compares
// against service-role truth. Any mismatch = a sync bug.
// Run: node scripts/audit-sync.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ACTIVE = ["open", "assigned", "in_progress", "waiting", "reopened"];
const mail = (m) => `${m}@user.mahasulsanket.in`;
const PASSWORD = "Demo@1234";

let failures = 0;
function check(label, got, expected) {
  const ok = got === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✅" : "❌"} ${label}: got ${got}, expected ${expected}`);
}
function info(label, value) {
  console.log(`  ℹ️  ${label}: ${value}`);
}

async function asUser(mobile) {
  const c = createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await c.auth.signInWithPassword({
    email: mail(mobile), password: PASSWORD,
  });
  if (error) throw new Error(`login failed for ${mobile}: ${error.message}`);
  return { c, uid: data.user.id };
}

const cnt = async (client, table, mod = (q) => q) => {
  const { count, error } = await mod(
    client.from(table).select("id", { count: "exact", head: true })
  );
  if (error) return `ERR: ${error.message}`;
  return count ?? 0;
};

async function main() {
  // ── truth (service role) ──
  const { data: pune } = await admin.from("districts").select("id").eq("code", "PUN").single();
  const T = {
    activeAll: await cnt(admin, "tickets", (q) => q.in("status", ACTIVE)),
    activePune: await cnt(admin, "tickets", (q) => q.in("status", ACTIVE).eq("district_id", pune.id)),
    l2Pune: await cnt(admin, "tickets", (q) => q.in("status", ACTIVE).eq("district_id", pune.id).eq("current_level", "L2")),
    l3Pune: await cnt(admin, "tickets", (q) => q.in("status", ACTIVE).eq("district_id", pune.id).eq("current_level", "L3")),
    l4Pune: await cnt(admin, "tickets", (q) => q.in("status", ACTIVE).eq("district_id", pune.id).eq("current_level", "L4")),
    pendingPune: await cnt(admin, "profiles", (q) => q.eq("status", "pending_verification").eq("district_id", pune.id)),
    proposals: await cnt(admin, "knowledge_proposals", (q) => q.eq("status", "proposed")),
    pendingDocs: await cnt(admin, "documents", (q) => q.eq("status", "pending_approval")),
    approvedDocs: await cnt(admin, "documents", (q) => q.eq("status", "approved")),
    overduePune: await cnt(admin, "tickets", (q) =>
      q.in("status", ACTIVE).eq("district_id", pune.id).lt("sla_due_at", new Date().toISOString())),
  };
  console.log("TRUTH (service role):", JSON.stringify(T), "\n");

  // ── L1 Talathi (Ramesh, 9000000001) ──
  console.log("── L1 Talathi (रमेश पाटील) ──");
  {
    const { c, uid } = await asUser("9000000001");
    const myOpen = await cnt(c, "tickets", (q) => q.eq("created_by", uid).in("status", ACTIVE));
    const truthMyOpen = await cnt(admin, "tickets", (q) => q.eq("created_by", uid).in("status", ACTIVE));
    check("my open tickets", myOpen, truthMyOpen);
    check("approved docs visible", await cnt(c, "documents", (q) => q.eq("status", "approved")), T.approvedDocs);
    const myConvs = await cnt(c, "conversations");
    const truthConvs = await cnt(admin, "conversations", (q) => q.eq("user_id", uid));
    check("own conversations (only own!)", myConvs, truthConvs);
    // must NOT see internal notes
    const { data: internals } = await c.from("ticket_replies").select("id").eq("is_internal", true).limit(5);
    check("internal notes hidden", internals?.length ?? 0, 0);
    // must NOT see other users' profiles
    const profs = await cnt(c, "profiles");
    check("sees only own profile", profs, 1);
    await c.auth.signOut();
  }

  // ── L2 Nayab Tahsildar (Suresh, 9000000004) ──
  console.log("\n── L2 Nayab Tahsildar (सुरेश देशमुख) ──");
  {
    const { c } = await asUser("9000000004");
    check("queue: L2 active in district", await cnt(c, "tickets", (q) => q.eq("current_level", "L2").in("status", ACTIVE)), T.l2Pune);
    check("overdue in district", await cnt(c, "tickets", (q) => q.in("status", ACTIVE).lt("sla_due_at", new Date().toISOString())), T.overduePune);
    // internal notes visible to officers
    const { data: internals } = await c.from("ticket_replies").select("id").eq("is_internal", true).limit(50);
    info("internal notes visible", internals?.length ?? "ERR");
    await c.auth.signOut();
  }

  // ── L3 DCO (Meena, 9000000005) ──
  console.log("\n── L3 DCO (डॉ. मीना कुलकर्णी) ──");
  {
    const { c } = await asUser("9000000005");
    check("pending verifications (district)", await cnt(c, "profiles", (q) => q.eq("status", "pending_verification")), T.pendingPune);
    check("escalated to L3", await cnt(c, "tickets", (q) => q.eq("current_level", "L3").in("status", ACTIVE)), T.l3Pune);
    check("active district tickets", await cnt(c, "tickets", (q) => q.in("status", ACTIVE)), T.activePune);
    await c.auth.signOut();
  }

  // ── L4 District Admin (Rajendra, 9000000006) ──
  console.log("\n── L4 District Admin (राजेंद्र पवार) ──");
  {
    const { c } = await asUser("9000000006");
    check("knowledge proposals pending", await cnt(c, "knowledge_proposals", (q) => q.eq("status", "proposed")), T.proposals);
    check("documents pending approval", await cnt(c, "documents", (q) => q.eq("status", "pending_approval")), T.pendingDocs);
    check("L4 tickets", await cnt(c, "tickets", (q) => q.eq("current_level", "L4").in("status", ACTIVE)), T.l4Pune);
    const audit = await cnt(c, "audit_logs");
    info("audit rows visible", audit);
    await c.auth.signOut();
  }

  // ── L5 State Admin (Smita, 9000000007) ──
  console.log("\n── L5 State Admin (स्मिता भोसले) ──");
  {
    const { c } = await asUser("9000000007");
    check("sees ALL active tickets (state)", await cnt(c, "tickets", (q) => q.in("status", ACTIVE)), T.activeAll);
    const allProfiles = await cnt(c, "profiles");
    const truthProfiles = await cnt(admin, "profiles");
    check("sees all profiles", allProfiles, truthProfiles);
    check("proposals pending", await cnt(c, "knowledge_proposals", (q) => q.eq("status", "proposed")), T.proposals);
    await c.auth.signOut();
  }

  // ── Realtime publication check (LIVE feature) ──
  console.log("\n── Realtime (LIVE dashboards) ──");
  const { data: pub, error: pubErr } = await admin
    .rpc("exec", {})
    .then(() => ({ data: null, error: null }))
    .catch(() => ({ data: null, error: null }));
  // query pg_publication_tables via postgrest is not possible; use SQL over http
  const res = await fetch(`${URL_}/rest/v1/rpc/`, { method: "HEAD" }).catch(() => null);
  info("realtime tables check", "run in SQL editor: select * from pg_publication_tables where pubname='supabase_realtime';");

  console.log(`\n${failures === 0 ? "🎉 ALL CHECKS PASSED" : `⚠️  ${failures} CHECK(S) FAILED`}`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error("AUDIT CRASHED:", e.message); process.exit(1); });
