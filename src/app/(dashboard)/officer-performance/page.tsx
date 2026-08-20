import { redirect } from "next/navigation";
import { Activity, CheckCircle2, Clock, Gauge } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/i18n/dictionaries";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "अधिकारी कामगिरी | महसूल संकेत" };

const ALLOWED = ["dco", "district_admin", "state_admin", "super_admin"];

interface Stat {
  id: string;
  assigned: number;
  resolved: number;
  slaTotal: number;
  slaMet: number;
  resolveDays: number[];
}

function aggregate(rows: { assigned_to: string | null; created_by: string | null; status: string; created_at: string; resolved_at: string | null; sla_due_at: string | null }[]) {
  const map = new Map<string, Stat>();
  for (const t of rows) {
    // Attribute to the handling officer when assigned, else the officer who
    // raised it — so the view reflects real activity in either workflow.
    const officerId = t.assigned_to ?? t.created_by;
    if (!officerId) continue;
    const s = map.get(officerId) ?? { id: officerId, assigned: 0, resolved: 0, slaTotal: 0, slaMet: 0, resolveDays: [] };
    s.assigned++;
    const isDone = t.status === "resolved" || t.status === "closed";
    if (isDone && t.resolved_at) {
      s.resolved++;
      s.resolveDays.push((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 86_400_000);
    }
    if (t.sla_due_at) {
      s.slaTotal++;
      if (t.resolved_at && new Date(t.resolved_at).getTime() <= new Date(t.sla_due_at).getTime()) s.slaMet++;
    }
    map.set(officerId, s);
  }
  return map;
}

export default async function OfficerPerformancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role)) redirect("/dashboard");

  // Tickets are RLS-scoped to the viewer's jurisdiction (district / state).
  const { data: tickets } = await supabase
    .from("tickets")
    .select("assigned_to, created_by, status, created_at, resolved_at, sla_due_at")
    .limit(3000);

  const stats = aggregate(tickets ?? []);
  const ids = [...stats.keys()];

  const admin = createAdminClient();
  const { data: officers } = ids.length
    ? await admin.from("profiles").select("id, full_name, role").in("id", ids)
    : { data: [] as { id: string; full_name: string; role: string }[] };
  const nameOf = new Map((officers ?? []).map((o) => [o.id, o]));

  const rows = ids
    .map((id) => {
      const s = stats.get(id)!;
      const avg = s.resolveDays.length ? s.resolveDays.reduce((a, b) => a + b, 0) / s.resolveDays.length : null;
      const slaPct = s.slaTotal ? Math.round((s.slaMet / s.slaTotal) * 100) : null;
      const o = nameOf.get(id);
      return { name: o?.full_name ?? "—", role: (o?.role ?? "talathi") as UserRole, ...s, avg, slaPct };
    })
    .sort((a, b) => b.resolved - a.resolved || b.assigned - a.assigned);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Activity className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold">अधिकारी कामगिरी / Officer performance</h1>
          <p className="text-sm text-muted">तुमच्या अधिकारक्षेत्रातील तिकीट हाताळणी. / Ticket handling across your jurisdiction.</p>
        </div>
      </div>

      {!rows.length && <Card className="p-8 text-center text-sm text-muted">नेमून दिलेली तिकिटे नाहीत. / No assigned tickets yet.</Card>}

      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs font-medium text-primary">{ROLE_LABELS[r.role]?.mr ?? r.role}</p>
              </div>
              {r.slaPct != null && (
                <Badge tone={r.slaPct >= 80 ? "success" : r.slaPct >= 50 ? "warning" : "danger"}>
                  <Gauge className="mr-1 inline h-3 w-3" aria-hidden /> SLA {r.slaPct}%
                </Badge>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric icon={Activity} label="नेमून / Assigned" value={r.assigned} />
              <Metric icon={CheckCircle2} label="निराकरण / Resolved" value={r.resolved} />
              <Metric icon={Gauge} label="दर / Rate" value={r.assigned ? `${Math.round((r.resolved / r.assigned) * 100)}%` : "—"} />
              <Metric icon={Clock} label="सरासरी दिवस / Avg days" value={r.avg != null ? r.avg.toFixed(1) : "—"} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
