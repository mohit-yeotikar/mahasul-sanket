// Demo data seeder — creates working logins for every level plus
// realistic tickets, escalations, SLA promises, proposals, feedback.
// Run:  node scripts/seed-demo.mjs
// Idempotent: safe to run again (skips existing users, adds no duplicate tickets).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ── env ──
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Demo@1234";
const mail = (m) => `${m}@user.mahasulsanket.in`;

const USERS = [
  { mobile: "9000000001", name: "रमेश पाटील (Ramesh Patil)", role: "talathi", gid: "SEV-TAL-1001" },
  { mobile: "9000000002", name: "सुनीता जाधव (Sunita Jadhav)", role: "talathi", gid: "SEV-TAL-1002" },
  { mobile: "9000000003", name: "अनिल शिंदे (Anil Shinde)", role: "circle_officer", gid: "SEV-CO-2001" },
  { mobile: "9000000004", name: "सुरेश देशमुख (Suresh Deshmukh)", role: "nayab_tahsildar", gid: "SEV-NT-3001" },
  { mobile: "9000000005", name: "डॉ. मीना कुलकर्णी (Dr. Meena Kulkarni)", role: "dco", gid: "SEV-DCO-4001" },
  { mobile: "9000000006", name: "राजेंद्र पवार (Rajendra Pawar)", role: "district_admin", gid: "SEV-DA-5001" },
  { mobile: "9000000007", name: "स्मिता भोसले (Smita Bhosale)", role: "state_admin", gid: "SEV-SA-6001" },
  // one unverified Talathi so the DCO has someone to verify in the demo
  { mobile: "9000000008", name: "विक्रम मोरे (Vikram More)", role: "talathi", gid: "SEV-TAL-1003", pending: true },
];

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const daysAhead = (d) => new Date(Date.now() + d * 86_400_000).toISOString();

async function main() {
  // ── geography (Pune / Haveli) ──
  const { data: pune } = await db.from("districts").select("id").eq("code", "PUN").single();
  if (!pune) throw new Error("Pune district missing — run migrations 0006/0009 first.");
  const { data: haveli } = await db
    .from("talukas").select("id").eq("district_id", pune.id).eq("name_en", "Haveli").single();

  // ── users ──
  const ids = {}; // mobile -> user id
  for (const u of USERS) {
    let userId;
    const { data: created, error } = await db.auth.admin.createUser({
      email: mail(u.mobile),
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { mobile: u.mobile, full_name: u.name },
    });
    if (error) {
      if (!/already/i.test(error.message)) throw error;
      // find existing
      const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
      userId = list.users.find((x) => x.email === mail(u.mobile))?.id;
      if (!userId) throw new Error(`Cannot find existing user ${u.mobile}`);
    } else {
      userId = created.user.id;
    }
    ids[u.mobile] = userId;

    await db.from("profiles").upsert({
      id: userId,
      full_name: u.name,
      mobile: u.mobile,
      government_id: u.gid,
      role: u.role,
      status: u.pending ? "pending_verification" : "active",
      district_id: pune.id,
      taluka_id: haveli?.id ?? null,
    });
    console.log(`user ok: ${u.name} [${u.role}]`);
  }

  const talathi1 = ids["9000000001"];
  const talathi2 = ids["9000000002"];
  const nayab = ids["9000000004"];
  const dco = ids["9000000005"];

  // ── tickets (skip if demo tickets already present) ──
  const { count: existing } = await db
    .from("tickets").select("id", { count: "exact", head: true })
    .like("subject", "%[DEMO]%");
  if (existing > 0) {
    console.log(`tickets: ${existing} demo tickets already exist — skipping ticket seed`);
  } else {
    const T = [
      { by: talathi1, sub: "[DEMO] सामायिक क्षेत्रातील फेरफार नोंदीस सह-हिस्सेदाराचा आक्षेप", cat: "ferfar", pri: "high", st: "open", lvl: "L2", created: 1 },
      { by: talathi1, sub: "[DEMO] ७/१२ वर पोट-खराब क्षेत्र चुकीचे दाखवले जात आहे", cat: "seven_twelve", pri: "medium", st: "in_progress", lvl: "L2", sla: 5, due: 3, created: 4 },
      { by: talathi2, sub: "[DEMO] वारस नोंदीसाठी परदेशस्थ वारसाचे संमतीपत्र कसे घ्यावे?", cat: "inheritance", pri: "medium", st: "in_progress", lvl: "L2", sla: 3, due: -1, created: 6 },
      { by: talathi2, sub: "[DEMO] ई-पीक पाहणी ॲपमध्ये गट क्रमांक दिसत नाही", cat: "crop_entry", pri: "critical", st: "reopened", lvl: "L3", sla: 2, due: 1, created: 8, esc: [["L2", "L3", "नायब तहसीलदारांच्या उत्तराने समाधान झाले नाही"]] },
      { by: talathi1, sub: "[DEMO] मोजणी अहवाल व प्रत्यक्ष ताबा यात तफावत — पुढील कार्यवाही?", cat: "survey", pri: "high", st: "reopened", lvl: "L4", created: 12, esc: [["L2", "L3", "उत्तर अपूर्ण होते"], ["L3", "L4", "अद्याप निर्णय प्रलंबित"]] },
      { by: talathi2, sub: "[DEMO] डिजिटल स्वाक्षरी प्रमाणपत्र कालबाह्य — नूतनीकरण प्रक्रिया", cat: "digital_signature", pri: "low", st: "resolved", lvl: "L2", sla: 7, due: 4, created: 10, resolved: 2 },
      { by: talathi1, sub: "[DEMO] अतिवृष्टी नुकसान पंचनाम्याची नोंद कोणत्या नमुन्यात करावी?", cat: "revenue", pri: "high", st: "resolved", lvl: "L3", created: 15, resolved: 5, esc: [["L2", "L3", "तातडीचा विषय"]] },
      { by: talathi2, sub: "[DEMO] निवासी दाखल्यासाठी ऑनलाईन प्रणालीत तांत्रिक अडचण", cat: "technical_issue", pri: "medium", st: "closed", lvl: "L2", created: 20, resolved: 16 },
    ];

    for (const t of T) {
      const { data: tk, error } = await db.from("tickets").insert({
        subject: t.sub,
        description: t.sub + " — सविस्तर माहिती तिकिटात दिली आहे. कृपया मार्गदर्शन करावे.",
        category: t.cat,
        priority: t.pri,
        status: t.st,
        current_level: t.lvl,
        created_by: t.by,
        district_id: pune.id,
        taluka_id: haveli?.id ?? null,
        created_at: daysAgo(t.created),
        sla_days: t.sla ?? null,
        sla_set_by: t.sla ? nayab : null,
        sla_set_by_level: t.sla ? "L2" : null,
        sla_due_at: t.due !== undefined ? daysAhead(t.due) : null,
        resolved_at: t.resolved !== undefined ? daysAgo(t.resolved) : null,
        ai_confidence: 42,
        source_question: t.sub.replace("[DEMO] ", ""),
      }).select("id").single();
      if (error) throw error;

      // NOTE: in batch inserts every row must set is_internal explicitly —
      // rows missing a key send NULL, which overrides the column default.
      const { error: repErr } = await db.from("ticket_replies").insert([
        {
          ticket_id: tk.id, author_id: t.by, is_internal: false,
          body: "कृपया लवकर मार्गदर्शन मिळावे — गावकरी वारंवार विचारणा करत आहेत.",
          created_at: daysAgo(t.created - 0.5),
        },
        {
          ticket_id: tk.id, author_id: t.lvl === "L2" ? nayab : dco, is_internal: false,
          body: t.st === "resolved" || t.st === "closed"
            ? "तपासणी पूर्ण. संबंधित शासन निर्णयानुसार कार्यवाही करावी — सविस्तर सूचना जोडल्या आहेत."
            : "तिकीट प्राप्त झाले आहे. संबंधित अभिलेख तपासून लवकरच सविस्तर उत्तर देतो.",
          created_at: daysAgo(Math.max(t.created - 1, 0.2)),
        },
        {
          ticket_id: tk.id, author_id: nayab, is_internal: true,
          body: "अंतर्गत टीप: मंडळ अधिकाऱ्यांकडून मूळ अभिलेखाची प्रत मागवली आहे.",
          created_at: daysAgo(Math.max(t.created - 1.2, 0.1)),
        },
      ]);
      if (repErr) throw new Error(`replies failed: ${repErr.message}`);

      for (const [from, to, reason] of t.esc ?? []) {
        await db.from("ticket_escalations").insert({
          ticket_id: tk.id, from_level: from, to_level: to,
          escalated_by: t.by, reason,
        });
      }
      await db.from("ticket_events").insert({
        ticket_id: tk.id, actor_id: t.by, event_type: "created", new_value: "open",
      });
    }
    console.log(`tickets: ${T.length} created with replies + escalations`);
  }

  // ── knowledge proposals (pending for L4 demo) ──
  const { count: propCount } = await db
    .from("knowledge_proposals").select("id", { count: "exact", head: true })
    .eq("status", "proposed");
  if (!propCount) {
    await db.from("knowledge_proposals").insert([
      {
        question: "परदेशस्थ वारसाच्या संमतीपत्रासाठी कोणती कागदपत्रे लागतात?",
        answer: "परदेशस्थ वारसाने भारतीय दूतावास/वाणिज्य दूतावासासमोर साक्षांकित केलेले संमतीपत्र (Apostille/Consular attestation), पासपोर्टची प्रत व नातेसंबंध सिद्ध करणारा पुरावा आवश्यक. साक्षांकित संमतीपत्र प्राप्त झाल्यावर नियमित वारस नोंद प्रक्रिया करावी.",
        proposed_by: dco,
      },
      {
        question: "ई-पीक पाहणीत गट क्रमांक न दिसल्यास काय करावे?",
        answer: "प्रथम गाव नकाशा व ७/१२ वरील गट क्रमांक जुळतो का ते तपासा. जुळत असूनही ॲपमध्ये दिसत नसल्यास तालुका स्तरावरील ई-पीक पाहणी समन्वयकाकडे 'गट क्रमांक अद्ययावत' विनंती नोंदवा — २४-४८ तासांत अद्ययावत होते.",
        proposed_by: dco,
      },
    ]);
    console.log("proposals: 2 pending knowledge proposals created");
  } else {
    console.log(`proposals: ${propCount} already pending — skipped`);
  }

  // ── conversations + feedback for the Talathi demo ──
  const { count: convCount } = await db
    .from("conversations").select("id", { count: "exact", head: true })
    .eq("user_id", talathi1);
  if (!convCount) {
    const QA = [
      ["गाव नमुना ७-ई म्हणजे काय?", "गाव नमुना ७-ई हे वनहक्क धारकांचे अधिकार अभिलेख पत्रक आहे. अनुसूचित जमाती व इतर पारंपारिक वन निवासी अधिनियम २००६ अन्वये मान्यता मिळालेल्या वन हक्कांची स्वतंत्र नोंद यात केली जाते.", 88, true],
      ["फेरफार नोंदीची मुदत किती?", "फेरफार नोंद प्राप्त झाल्यापासून १५ दिवसांच्या आत संबंधितांना नोटीस देऊन, आक्षेप न आल्यास पुढील १५ दिवसांत नोंद प्रमाणित करणे अपेक्षित आहे.", 74, true],
      ["पोट-खराब वर्ग-अ आणि वर्ग-ब मधील फरक?", "वर्ग-अ म्हणजे लागवडीस पूर्णतः अयोग्य क्षेत्र (खडक, नाले), तर वर्ग-ब म्हणजे विशिष्ट कारणांसाठी राखीव क्षेत्र (रस्ते, कालवे). दोन्हींची नोंद ७/१२ वर स्वतंत्र दर्शवली जाते.", 51, false],
    ];
    for (const [q, a, conf, helpful] of QA) {
      const { data: conv } = await db.from("conversations")
        .insert({ user_id: talathi1, title: q }).select("id").single();
      await db.from("messages").insert({ conversation_id: conv.id, role: "user", content: q });
      const { data: msg } = await db.from("messages").insert({
        conversation_id: conv.id, role: "assistant", content: a,
        confidence: conf, citations: [], related_questions: [],
      }).select("id").single();
      await db.from("feedback").insert({
        user_id: talathi1, message_id: msg.id, is_helpful: helpful,
      });
    }
    console.log("chats: 3 conversations + feedback created");
  } else {
    console.log("chats: already exist — skipped");
  }

  // ── notifications ──
  await db.from("notifications").insert([
    { user_id: talathi1, type: "ticket_sla_set", title: "तिकीट — निराकरण कालावधी: ५ दिवस", body: "L2 अधिकाऱ्याने कालावधी निश्चित केला आहे.", link: "/tickets" },
    { user_id: nayab, type: "ticket_created", title: "नवीन तिकीट प्राप्त", body: "फेरफार विषयक नवीन तिकीट रांगेत आहे.", link: "/tickets" },
    { user_id: dco, type: "system", title: "पडताळणीसाठी नवीन खाते", body: "विक्रम मोरे — शासकीय ID पडताळणी प्रलंबित.", link: "/dco" },
  ]);

  console.log("\n✅ Demo seed complete!");
  console.log(`\nLogins (password for all: ${PASSWORD})`);
  for (const u of USERS) console.log(`  ${u.mobile}  ${u.role.padEnd(16)} ${u.name}${u.pending ? "  [pending — verify via DCO]" : ""}`);
}

main().catch((e) => { console.error("SEED FAILED:", e.message); process.exit(1); });
