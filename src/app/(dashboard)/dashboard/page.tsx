import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TalathiDashboard, type TalathiDashboardData } from "@/features/dashboard/TalathiDashboard";
import { OfficerL2Dashboard, type OfficerL2Data } from "@/features/dashboard/OfficerL2Dashboard";
import { DcoL3Dashboard, type DcoL3Data } from "@/features/dashboard/DcoL3Dashboard";
import { AdminL4Dashboard, type AdminL4Data } from "@/features/dashboard/AdminL4Dashboard";
import { StateL5Dashboard, type StateL5Data } from "@/features/dashboard/StateL5Dashboard";
import {
  CitizenDashboard,
  type CitizenDashboardData,
  type CitizenOfficer,
  type CitizenInfoItem,
} from "@/features/dashboard/CitizenDashboard";

export const metadata = { title: "मुख्यपृष्ठ | महसूल संकेत" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user!.id).single();
  const isFieldUser = ["talathi", "circle_officer"].includes(profile?.role ?? "talathi");

  // ── Citizen: limited public home (info feed + area officers) ──
  if (profile?.role === "citizen") {
    const { data: me } = await supabase
      .from("profiles")
      .select("district_id, taluka_id, district:districts(name_mr,name_en)")
      .eq("id", user!.id)
      .single();

    const districtId = (me as { district_id?: string } | null)?.district_id ?? null;
    const talukaId = (me as { taluka_id?: string } | null)?.taluka_id ?? null;

    const [officersRes, docsRes] = await Promise.all([
      districtId
        ? supabase.rpc("area_officers", { p_district: districtId, p_taluka: talukaId })
        : Promise.resolve({ data: [] as CitizenOfficer[] }),
      supabase
        .from("documents")
        .select("id,title,title_mr,summary,doc_type,gr_number,issued_date,created_at")
        .eq("status", "approved")
        .order("issued_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const dist = (me?.district as { name_mr?: string; name_en?: string } | null) ?? null;

    const data: CitizenDashboardData = {
      fullName: profile?.full_name ?? "",
      districtNameMr: dist?.name_mr ?? null,
      districtNameEn: dist?.name_en ?? null,
      officers: (officersRes.data ?? []) as CitizenOfficer[],
      newInfo: (docsRes.data ?? []) as CitizenInfoItem[],
    };
    return <CitizenDashboard data={data} />;
  }

  if (isFieldUser) {
    const [
      { count: openTickets },
      { count: resolvedTickets },
      { count: conversations },
      { count: documents },
      { data: recentTickets },
      { data: recentConversations },
    ] = await Promise.all([
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("created_by", user!.id)
        .in("status", ["open", "assigned", "in_progress", "waiting", "reopened"]),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("created_by", user!.id)
        .in("status", ["resolved", "closed"]),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase.from("tickets")
        .select("id,ticket_number,subject,status,current_level,sla_due_at")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const data: TalathiDashboardData = {
      fullName: profile?.full_name ?? "",
      openTickets: openTickets ?? 0,
      resolvedTickets: resolvedTickets ?? 0,
      conversations: conversations ?? 0,
      documents: documents ?? 0,
      recentTickets: recentTickets ?? [],
      recentConversations: recentConversations ?? [],
    };
    return <TalathiDashboard data={data} />;
  }

  if (profile?.role === "nayab_tahsildar") {
    const active = ["open", "assigned", "in_progress", "waiting", "reopened"];
    const [
      { count: pendingQueue },
      { count: inProgress },
      { count: overdue },
      { count: resolvedTotal },
      { data: queue },
    ] = await Promise.all([
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("current_level", "L2").in("status", active),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("current_level", "L2").eq("status", "in_progress"),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("current_level", "L2").in("status", active)
        .lt("sla_due_at", new Date().toISOString()),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .in("status", ["resolved", "closed"]),
      supabase.from("tickets")
        .select("id,ticket_number,subject,category,priority,status,current_level,sla_due_at,created_at")
        .eq("current_level", "L2").in("status", active)
        .order("sla_due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .limit(8),
    ]);

    const data: OfficerL2Data = {
      fullName: profile?.full_name ?? "",
      pendingQueue: pendingQueue ?? 0,
      inProgress: inProgress ?? 0,
      overdue: overdue ?? 0,
      resolvedTotal: resolvedTotal ?? 0,
      queue: queue ?? [],
    };
    return <OfficerL2Dashboard data={data} />;
  }

  if (profile?.role === "dco") {
    const active = ["open", "assigned", "in_progress", "waiting", "reopened"];
    const [
      { count: pendingVerifications },
      { count: escalatedToMe },
      { count: activeDistrict },
      { count: overdue },
      { data: escalatedQueue },
      { data: pendingUsers },
      { data: activeCats },
      { data: me },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .eq("status", "pending_verification"),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("current_level", "L3").in("status", active),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .in("status", active),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .in("status", active).lt("sla_due_at", new Date().toISOString()),
      supabase.from("tickets")
        .select("id,ticket_number,subject,category,priority,status,current_level,sla_due_at,created_at")
        .eq("current_level", "L3").in("status", active)
        .order("created_at", { ascending: true })
        .limit(6),
      supabase.from("profiles").select("id,full_name,mobile,created_at")
        .eq("status", "pending_verification")
        .order("created_at").limit(4),
      supabase.from("tickets").select("category").in("status", active).limit(1000),
      supabase.from("profiles")
        .select("district:districts(name_mr)")
        .eq("id", user!.id).single(),
    ]);

    const counts = new Map<string, number>();
    for (const row of activeCats ?? []) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }
    const categoryCounts = [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const data: DcoL3Data = {
      fullName: profile?.full_name ?? "",
      districtNameMr:
        (me?.district as { name_mr?: string } | null)?.name_mr ?? null,
      pendingVerifications: pendingVerifications ?? 0,
      escalatedToMe: escalatedToMe ?? 0,
      activeDistrict: activeDistrict ?? 0,
      overdue: overdue ?? 0,
      escalatedQueue: escalatedQueue ?? [],
      pendingUsers: pendingUsers ?? [],
      categoryCounts,
    };
    return <DcoL3Dashboard data={data} />;
  }

  if (profile?.role === "district_admin") {
    const active = ["open", "assigned", "in_progress", "waiting", "reopened"];
    const [
      { count: pendingProposals },
      { count: pendingDocuments },
      { count: escalatedL4 },
      { count: activeUsers },
      { data: escalatedQueue },
      { data: roleRows },
      { data: auditRows },
      { data: proposals },
      { data: me },
    ] = await Promise.all([
      supabase.from("knowledge_proposals").select("id", { count: "exact", head: true })
        .eq("status", "proposed"),
      supabase.from("documents").select("id", { count: "exact", head: true })
        .eq("status", "pending_approval"),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("current_level", "L4").in("status", active),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("tickets")
        .select("id,ticket_number,subject,category,priority,status,current_level,sla_due_at,created_at")
        .eq("current_level", "L4").in("status", active)
        .order("created_at", { ascending: true })
        .limit(6),
      supabase.from("profiles").select("role").eq("status", "active").limit(2000),
      supabase.from("audit_logs")
        .select("id,action,created_at,actor:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("knowledge_proposals").select("id,question,created_at")
        .eq("status", "proposed")
        .order("created_at").limit(4),
      supabase.from("profiles")
        .select("district:districts(name_mr)")
        .eq("id", user!.id).single(),
    ]);

    const roleMap = new Map<string, number>();
    for (const r of roleRows ?? []) roleMap.set(r.role, (roleMap.get(r.role) ?? 0) + 1);
    const roleCounts = [...roleMap.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    const data: AdminL4Data = {
      fullName: profile?.full_name ?? "",
      districtNameMr:
        (me?.district as { name_mr?: string } | null)?.name_mr ?? null,
      pendingProposals: pendingProposals ?? 0,
      pendingDocuments: pendingDocuments ?? 0,
      escalatedL4: escalatedL4 ?? 0,
      activeUsers: activeUsers ?? 0,
      escalatedQueue: escalatedQueue ?? [],
      roleCounts,
      recentAudit: (auditRows ?? []).map((a) => ({
        id: a.id,
        action: a.action,
        created_at: a.created_at,
        actor_name: (a.actor as { full_name?: string } | null)?.full_name ?? null,
      })),
      proposals: proposals ?? [],
    };
    return <AdminL4Dashboard data={data} />;
  }

  // L5 — State / Super Admin: the whole state at a glance.
  // State-wide aggregates use the admin client: RLS rightly hides other
  // users' private conversations, but the state head needs the COUNTS.
  const admin = createAdminClient();
  const active = ["open", "assigned", "in_progress", "waiting", "reopened"];
  const [
    { count: activeUsers },
    { count: totalTickets },
    { count: resolvedTickets },
    { count: aiConversations },
    { data: feedbackRows },
    { count: knowledgeDocs },
    { count: pendingProposals },
    { count: pendingDocs },
    { count: pendingVerifications },
    { data: activeTicketRows },
    { data: pendingUserRows },
    { data: districts },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("tickets").select("id", { count: "exact", head: true }),
    admin.from("tickets").select("id", { count: "exact", head: true })
      .in("status", ["resolved", "closed"]),
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin.from("feedback").select("is_helpful").not("is_helpful", "is", null).limit(5000),
    admin.from("documents").select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    admin.from("knowledge_proposals").select("id", { count: "exact", head: true })
      .eq("status", "proposed"),
    admin.from("documents").select("id", { count: "exact", head: true })
      .eq("status", "pending_approval"),
    admin.from("profiles").select("id", { count: "exact", head: true })
      .eq("status", "pending_verification"),
    admin.from("tickets").select("district_id,sla_due_at").in("status", active).limit(5000),
    admin.from("profiles").select("district_id").eq("status", "pending_verification").limit(5000),
    admin.from("districts").select("id,code,name_mr,name_en"),
  ]);

  const now = Date.now();
  const byDistrict = new Map<string, { active: number; overdue: number; pendingUsers: number }>();
  const bump = (id: string | null, key: "active" | "overdue" | "pendingUsers") => {
    if (!id) return;
    const m = byDistrict.get(id) ?? { active: 0, overdue: 0, pendingUsers: 0 };
    m[key]++;
    byDistrict.set(id, m);
  };
  for (const t of activeTicketRows ?? []) {
    bump(t.district_id, "active");
    if (t.sla_due_at && new Date(t.sla_due_at).getTime() < now) bump(t.district_id, "overdue");
  }
  for (const p of pendingUserRows ?? []) bump(p.district_id, "pendingUsers");

  const districtMetrics = (districts ?? []).map((d) => {
    const m = byDistrict.get(d.id) ?? { active: 0, overdue: 0, pendingUsers: 0 };
    return { code: d.code, nameMr: d.name_mr ?? d.name_en, ...m };
  });

  const helpful = (feedbackRows ?? []).filter((f) => f.is_helpful).length;
  const fbTotal = feedbackRows?.length ?? 0;

  const data: StateL5Data = {
    fullName: profile?.full_name ?? "",
    activeUsers: activeUsers ?? 0,
    totalTickets: totalTickets ?? 0,
    resolutionRate:
      totalTickets && totalTickets > 0
        ? Math.round(((resolvedTickets ?? 0) / totalTickets) * 100)
        : null,
    aiConversations: aiConversations ?? 0,
    aiHelpfulRate: fbTotal > 0 ? Math.round((helpful / fbTotal) * 100) : null,
    knowledgeDocs: knowledgeDocs ?? 0,
    pendingApprovals: (pendingProposals ?? 0) + (pendingDocs ?? 0),
    pendingVerifications: pendingVerifications ?? 0,
    districtMetrics,
  };
  return <StateL5Dashboard data={data} />;
}
