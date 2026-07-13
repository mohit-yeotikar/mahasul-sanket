import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui";
import { TicketsList } from "@/features/tickets/TicketsList";

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

      {!tickets?.length ? (
        <Card className="p-10 text-center text-muted">
          अद्याप तिकिटे नाहीत. / No tickets yet.
        </Card>
      ) : (
        <TicketsList tickets={tickets} />
      )}
    </div>
  );
}
