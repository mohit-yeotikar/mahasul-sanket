import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";

export const metadata = { title: "अहवाल | महसूल संकेत" };

export default async function ReportsPage() {
  const supabase = await createClient();

  const [tickets, resolved, docs, convs, feedback] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true })
      .in("status", ["resolved", "closed"]),
    supabase.from("documents").select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("feedback").select("is_helpful"),
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

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">अहवाल / Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted">
        जिल्हानिहाय व तालुकानिहाय तपशीलवार अहवाल पुढील आवृत्तीत. / District-wise drill-downs come next.
      </p>
    </div>
  );
}
