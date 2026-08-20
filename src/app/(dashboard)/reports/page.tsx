import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";

export const metadata = { title: "अहवाल | महसूल संकेत" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "उघडे / Open", assigned: "नेमून / Assigned", in_progress: "प्रगतीत / In progress",
  waiting: "प्रतीक्षेत / Waiting", resolved: "निराकरण / Resolved", closed: "बंद / Closed", reopened: "पुन्हा उघडले / Reopened",
};

// SLA compliance over tickets that carry a promised due date. Kept as a plain
// helper (not in the component body) so the current-time read stays out of render.
function computeSla(rows: { sla_due_at: string | null; resolved_at: string | null }[]) {
  const now = Date.now();
  let met = 0, breached = 0, onTrack = 0;
  for (const r of rows) {
    if (!r.sla_due_at) continue;
    const due = new Date(r.sla_due_at).getTime();
    if (r.resolved_at) {
      if (new Date(r.resolved_at).getTime() <= due) met++; else breached++;
    } else if (due < now) breached++; else onTrack++;
  }
  return { met, breached, onTrack, total: met + breached + onTrack };
}

export default async function ReportsPage() {
  const supabase = await createClient();

  const [tickets, resolved, docs, convs, feedback, detail, escalations] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", ["resolved", "closed"]),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("feedback").select("is_helpful"),
    supabase.from("tickets").select("category, status, sla_due_at, resolved_at").limit(2000),
    supabase.from("ticket_escalations").select("to_level").limit(2000),
  ]);

  const total = tickets.count ?? 0;
  const done = resolved.count ?? 0;
  const helpful = feedback.data?.filter((f) => f.is_helpful).length ?? 0;
  const fbTotal = feedback.data?.length ?? 0;

  const stats = [
    { label: "एकूण तिकिटे / Total tickets", value: total },
    { label: "निराकरण दर / Resolution rate", value: total ? `${Math.round((done / total) * 100)}%` : "—" },
    { label: "AI संभाषणे / AI conversations", value: convs.count ?? 0 },
    { label: "ज्ञान दस्तऐवज / Knowledge documents", value: docs.count ?? 0 },
    { label: "AI उपयुक्तता / AI helpfulness", value: fbTotal ? `${Math.round((helpful / fbTotal) * 100)}%` : "—" },
    { label: "प्रलंबित तिकिटे / Pending tickets", value: total - done },
  ];

  const rows = detail.data ?? [];

  // Tickets by category
  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] ?? 1;

  // Status distribution
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  const statuses = [...byStatus.entries()].sort((a, b) => b[1] - a[1]);

  // SLA compliance (tickets with a promised due date)
  const { met: slaMet, breached: slaBreached, onTrack: slaOnTrack, total: slaTotal } = computeSla(rows);
  const slaPct = slaTotal ? Math.round((slaMet / slaTotal) * 100) : null;

  // Escalations by level
  const escBy = new Map<string, number>();
  for (const e of escalations.data ?? []) escBy.set(e.to_level, (escBy.get(e.to_level) ?? 0) + 1);
  const escLevels = ["L2", "L3", "L4"].map((l) => [l, escBy.get(l) ?? 0] as const);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">अहवाल / Reports</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tickets by category */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">विषयनिहाय तिकिटे / Tickets by category</h2>
          {!cats.length && <p className="py-4 text-center text-sm text-muted">डेटा नाही / No data</p>}
          <div className="space-y-2.5">
            {cats.map(([cat, count]) => (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{CATEGORY_LABELS[cat]?.mr ?? cat}</span>
                  <span className="tabular-nums text-muted">{count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.max(5, Math.round((count / maxCat) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SLA compliance */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">SLA पालन / SLA compliance</h2>
          {!slaTotal ? (
            <p className="py-4 text-center text-sm text-muted">SLA असलेली तिकिटे नाहीत / No tickets with an SLA</p>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold tabular-nums text-primary">{slaPct}%</p>
                <p className="pb-1 text-sm text-muted">वेळेत निराकरण / met on time</p>
              </div>
              <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="bg-success" style={{ width: `${(slaMet / slaTotal) * 100}%` }} />
                <div className="bg-warning" style={{ width: `${(slaOnTrack / slaTotal) * 100}%` }} />
                <div className="bg-danger" style={{ width: `${(slaBreached / slaTotal) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge tone="success">वेळेत / Met: {slaMet}</Badge>
                <Badge tone="warning">मुदतीत / On track: {slaOnTrack}</Badge>
                <Badge tone="danger">मुदत उलटली / Breached: {slaBreached}</Badge>
              </div>
            </>
          )}

          <h2 className="mb-3 mt-6 font-semibold">एस्केलेशन / Escalations by level</h2>
          <div className="grid grid-cols-3 gap-2">
            {escLevels.map(([lvl, n]) => (
              <div key={lvl} className="rounded-xl bg-surface-2/60 p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{n}</p>
                <p className="text-xs text-muted">→ {lvl}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Status distribution */}
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">स्थिती वितरण / Status distribution</h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map(([st, n]) => (
            <span key={st} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm">
              {STATUS_LABEL[st] ?? st}
              <span className="rounded-full bg-surface-2 px-2 text-xs font-semibold tabular-nums">{n}</span>
            </span>
          ))}
        </div>
      </Card>

      <p className="text-xs text-muted">
        विश्लेषण तुमच्या अधिकारक्षेत्रानुसार (जिल्हा/राज्य) आपोआप मर्यादित. / Analytics are automatically scoped to your jurisdiction (district/state).
      </p>
    </div>
  );
}
