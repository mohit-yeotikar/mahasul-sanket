import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card } from "@/components/ui";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";

export const metadata = { title: "तिकिटे | महसूल संकेत" };

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,ticket_number,subject,category,priority,status,current_level,sla_due_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">तिकिटे / Tickets</h1>
        <Link href="/tickets/new">
          <Button><Plus className="h-4 w-4" /> नवीन तिकीट</Button>
        </Link>
      </div>

      {!tickets?.length && (
        <Card className="p-10 text-center text-muted">
          अद्याप तिकिटे नाहीत. / No tickets yet.
        </Card>
      )}

      <div className="space-y-3">
        {tickets?.map((t) => (
          <Link key={t.id} href={`/tickets/${t.id}`} className="block">
            <Card className="p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">{t.ticket_number}</span>
                <TicketStatusBadge status={t.status} />
                <Badge tone="primary">{t.current_level}</Badge>
                <Badge tone={t.priority === "critical" || t.priority === "high" ? "danger" : "neutral"}>
                  {t.priority}
                </Badge>
                {t.sla_due_at && (
                  <Badge tone={new Date(t.sla_due_at) < new Date() ? "danger" : "warning"}>
                    ⏱ {new Date(t.sla_due_at).toLocaleDateString("mr-IN")}
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-medium">{t.subject}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
