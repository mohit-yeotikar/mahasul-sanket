import { redirect } from "next/navigation";
import { Sparkles, ThumbsUp, Gauge, Trophy } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "राज्य AI गुणवत्ता | महसूल संकेत" };

const ALLOWED = ["state_admin", "super_admin"];
const DONE = ["resolved", "closed"];

const BUCKETS = [
  { min: 80, label: "उच्च (80-100%)", en: "High", tone: "bg-success" },
  { min: 60, label: "मध्यम (60-80%)", en: "Medium", tone: "bg-primary" },
  { min: 40, label: "कमी (40-60%)", en: "Low", tone: "bg-warning" },
  { min: 0, label: "फार कमी (<40%)", en: "Very low", tone: "bg-danger" },
];

export default async function StatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role)) redirect("/dashboard");

  const admin = createAdminClient();
  const [{ data: msgs }, { data: fb }, { data: tickets }, { data: districts }] = await Promise.all([
    admin.from("messages").select("confidence").eq("role", "assistant").not("confidence", "is", null).limit(8000),
    admin.from("feedback").select("is_helpful").limit(8000),
    admin.from("tickets").select("district_id, status").limit(8000),
    admin.from("districts").select("id, name_mr, name_en"),
  ]);

  const confs = (msgs ?? []).map((m) => Number(m.confidence)).filter((n) => Number.isFinite(n));
  const avgConf = confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0;
  const dist = BUCKETS.map((b, i) => {
    const upper = i === 0 ? 101 : BUCKETS[i - 1].min;
    const count = confs.filter((c) => c >= b.min && c < upper).length;
    return { ...b, count, pct: confs.length ? Math.round((count / confs.length) * 100) : 0 };
  });

  const helpful = (fb ?? []).filter((f) => f.is_helpful === true).length;
  const unhelpful = (fb ?? []).filter((f) => f.is_helpful === false).length;
  const fbTotal = helpful + unhelpful;
  const helpfulPct = fbTotal ? Math.round((helpful / fbTotal) * 100) : null;

  // District league table
  const nameOf = new Map((districts ?? []).map((d) => [d.id, d]));
  const byDist = new Map<string, { total: number; done: number }>();
  for (const t of tickets ?? []) {
    if (!t.district_id) continue;
    const s = byDist.get(t.district_id) ?? { total: 0, done: 0 };
    s.total++;
    if (DONE.includes(t.status)) s.done++;
    byDist.set(t.district_id, s);
  }
  const league = [...byDist.entries()]
    .map(([id, s]) => ({ id, name: nameOf.get(id)?.name_mr ?? "—", total: s.total, done: s.done, rate: s.total ? Math.round((s.done / s.total) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate || b.total - a.total)
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-fg"><Sparkles className="h-5 w-5" aria-hidden /></span>
        <div>
          <h1 className="text-2xl font-bold">राज्य AI गुणवत्ता / State AI quality</h1>
          <p className="text-sm text-muted">विश्वास वितरण, अभिप्राय व जिल्हा क्रमवारी. / Confidence, feedback &amp; district league.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { icon: Gauge, label: "सरासरी विश्वास / Avg confidence", value: `${avgConf}%` },
          { icon: Sparkles, label: "एकूण उत्तरे / AI answers", value: confs.length },
          { icon: ThumbsUp, label: "उपयुक्तता / Helpfulness", value: helpfulPct != null ? `${helpfulPct}%` : "—" },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><m.icon className="h-4 w-4" aria-hidden /></div>
            <p className="text-2xl font-bold tabular-nums">{m.value}</p>
            <p className="text-xs text-muted">{m.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">विश्वास वितरण / Confidence distribution</h2>
        {!confs.length && <p className="py-4 text-center text-sm text-muted">डेटा नाही / No data</p>}
        <div className="space-y-3">
          {dist.map((b) => (
            <div key={b.en}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{b.label}</span>
                <span className="tabular-nums text-muted">{b.count} · {b.pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className={`h-full rounded-full ${b.tone}`} style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        {fbTotal > 0 && (
          <p className="mt-4 text-sm text-muted">
            अभिप्राय / Feedback: <span className="font-semibold text-success">{helpful} 👍</span> · <span className="font-semibold text-danger">{unhelpful} 👎</span>
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-accent" aria-hidden />जिल्हा क्रमवारी / District league (resolution rate)</h2>
        {!league.length && <p className="py-4 text-center text-sm text-muted">डेटा नाही / No data</p>}
        <ol className="space-y-2">
          {league.map((d, i) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"}`}>{i + 1}</span>
              <span className="min-w-0 flex-1 font-medium">{d.name}</span>
              <span className="text-xs text-muted">{d.done}/{d.total}</span>
              <Badge tone={d.rate >= 70 ? "success" : d.rate >= 40 ? "warning" : "danger"}>{d.rate}%</Badge>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
