import { createClient } from "@/lib/supabase/server";
import { AuditLog, type AuditRow } from "@/features/admin/AuditLog";

export const dynamic = "force-dynamic";
export const metadata = { title: "लेखापरीक्षण | महसूल संकेत" };

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id,action,entity,entity_id,created_at,actor:profiles(full_name,role)")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: AuditRow[] = (logs ?? []).map((l) => {
    const actor = l.actor as unknown as { full_name?: string; role?: string } | null;
    return {
      id: l.id as number,
      created_at: l.created_at as string,
      action: l.action as string,
      entity: (l.entity as string) ?? null,
      entity_id: (l.entity_id as string) ?? null,
      actor_name: actor?.full_name ?? "system",
      actor_role: actor?.role ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">लेखापरीक्षण नोंदी / Audit Logs</h1>
      <AuditLog logs={rows} />
    </div>
  );
}
