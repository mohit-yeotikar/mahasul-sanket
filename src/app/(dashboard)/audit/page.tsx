import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";

export const metadata = { title: "लेखापरीक्षण | महसूल संकेत" };

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id,action,entity,entity_id,created_at,actor:profiles(full_name,role)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">लेखापरीक्षण नोंदी / Audit Logs</h1>
      <Card className="divide-y divide-border">
        {!logs?.length && <p className="p-6 text-center text-sm text-muted">नोंदी नाहीत.</p>}
        {logs?.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="font-mono text-xs text-muted">
              {new Date(l.created_at).toLocaleString("mr-IN")}
            </span>
            <span className="font-medium">
              {(l.actor as { full_name?: string } | null)?.full_name ?? "system"}
            </span>
            <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">{l.action}</span>
            <span className="text-muted">{l.entity}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
