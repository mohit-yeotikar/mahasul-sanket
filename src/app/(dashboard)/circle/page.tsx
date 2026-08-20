import { redirect } from "next/navigation";
import { Users, AlertTriangle, CircleDot, Clock } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "मंडळ आढावा | महसूल संकेत" };

const ALLOWED = ["circle_officer", "nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];
const OPEN = ["open", "assigned", "in_progress", "waiting", "reopened"];

interface TRow { created_by: string | null; status: string; sla_due_at: string | null; resolved_at: string | null; created_at: string }

function summarise(tickets: TRow[]) {
  const now = Date.now();
  const per = new Map<string, { open: number; resolved: number; overdue: number; days: number[] }>();
  for (const t of tickets) {
    if (!t.created_by) continue;
    const s = per.get(t.created_by) ?? { open: 0, resolved: 0, overdue: 0, days: [] };
    if (OPEN.includes(t.status)) s.open++;
    if (t.status === "resolved" || t.status === "closed") {
      s.resolved++;
      if (t.resolved_at) s.days.push((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 86_400_000);
    }
    if (t.sla_due_at && !t.resolved_at && new Date(t.sla_due_at).getTime() < now) s.overdue++;
    per.set(t.created_by, s);
  }
  return per;
}

export default async function CirclePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role, taluka_id, district_id").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role)) redirect("/dashboard");

  const admin = createAdminClient();
  // Scope: the circle officer's taluka; higher roles without a taluka see their district.
  const talathiQ = admin.from("profiles").select("id, full_name, mobile, taluka:talukas(name_mr,name_en)").eq("role", "talathi").eq("status", "active");
  const ticketQ = admin.from("tickets").select("created_by, status, sla_due_at, resolved_at, created_at").limit(3000);
  if (me.taluka_id) { talathiQ.eq("taluka_id", me.taluka_id); ticketQ.eq("taluka_id", me.taluka_id); }
  else if (me.district_id) { talathiQ.eq("district_id", me.district_id); ticketQ.eq("district_id", me.district_id); }

  const [{ data: talathis }, { data: tickets }] = await Promise.all([talathiQ, ticketQ]);
  const per = summarise((tickets ?? []) as TRow[]);

  const rows = (talathis ?? []).map((t) => {
    const s = per.get(t.id) ?? { open: 0, resolved: 0, overdue: 0, days: [] };
    const avg = s.days.length ? s.days.reduce((a, b) => a + b, 0) / s.days.length : null;
    const taluka = t.taluka as unknown as { name_mr?: string; name_en?: string } | null;
    return { id: t.id, name: t.full_name as string, mobile: t.mobile as string, taluka, ...s, avg };
  }).sort((a, b) => b.overdue - a.overdue || b.open - a.open);

  const totalOpen = rows.reduce((n, r) => n + r.open, 0);
  const totalOverdue = rows.reduce((n, r) => n + r.overdue, 0);
  const bottlenecks = rows.filter((r) => r.overdue > 0 || r.open >= 5);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CircleDot className="h-5 w-5" aria-hidden /></span>
        <div>
          <h1 className="text-2xl font-bold">मंडळ आढावा / Circle overview</h1>
          <p className="text-sm text-muted">तुमच्या मंडळातील तलाठी व त्यांचा भार. / Talathis in your circle and their load.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "तलाठी / Talathis", value: rows.length, tone: "bg-primary/12 text-primary" },
          { icon: Clock, label: "प्रलंबित / Open", value: totalOpen, tone: "bg-warning/12 text-warning" },
          { icon: AlertTriangle, label: "मुदत उलटलेली / Overdue", value: totalOverdue, tone: "bg-danger/12 text-danger" },
        ].map((m) => (
          <Card key={m.label} className="p-4">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${m.tone}`}><m.icon className="h-4 w-4" aria-hidden /></div>
            <p className="text-2xl font-bold tabular-nums">{m.value}</p>
            <p className="text-xs text-muted">{m.label}</p>
          </Card>
        ))}
      </div>

      {!!bottlenecks.length && (
        <Card className="border-danger/25 bg-danger/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger"><AlertTriangle className="h-4 w-4" aria-hidden />अडथळे / Bottleneck alerts</p>
          <p className="mt-1 text-sm text-muted">
            {bottlenecks.map((b) => b.name).join(", ")} — {bottlenecks.some((b) => b.overdue > 0) ? "मुदत उलटलेली तिकिटे / overdue tickets" : "जास्त प्रलंबित भार / high open load"}.
          </p>
        </Card>
      )}

      {!rows.length && <Card className="p-8 text-center text-sm text-muted">या मंडळात सक्रिय तलाठी आढळले नाहीत. / No active Talathis in this circle.</Card>}

      <div className="space-y-2.5">
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted">{r.mobile}{r.taluka ? ` · ${r.taluka.name_mr}` : ""}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="warning">{r.open} प्रलंबित</Badge>
              <Badge tone="success">{r.resolved} निराकरण</Badge>
              {r.overdue > 0 && <Badge tone="danger"><AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden />{r.overdue} मुदत</Badge>}
              <span className="text-xs text-muted">{r.avg != null ? `${r.avg.toFixed(1)} दिवस सरासरी` : "—"}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
