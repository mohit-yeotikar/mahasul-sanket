import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { PendingUserRow } from "@/features/dco/PendingUserRow";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import Link from "next/link";
import { Badge } from "@/components/ui";

export const metadata = { title: "DCO पॅनेल | महसूल संकेत" };

export default async function DcoPage() {
  const supabase = await createClient();

  const [{ data: pendingUsers }, { data: tickets }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,mobile,government_id,created_at,taluka:talukas(name_mr,name_en)")
      .eq("status", "pending_verification")
      .order("created_at"),
    supabase
      .from("tickets")
      .select("id,ticket_number,subject,status,current_level,priority,created_at")
      .in("status", ["open", "assigned", "in_progress", "waiting", "reopened"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">DCO पॅनेल / District Panel</h1>

      <section>
        <h2 className="mb-3 font-semibold">
          खाते पडताळणी प्रलंबित ({pendingUsers?.length ?? 0}) / Pending verifications
        </h2>
        {!pendingUsers?.length && (
          <Card className="p-6 text-center text-sm text-muted">
            पडताळणीसाठी कोणतीही खाती प्रलंबित नाहीत.
          </Card>
        )}
        <div className="space-y-3">
          {pendingUsers?.map((u) => <PendingUserRow key={u.id} user={u as never} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">
          जिल्ह्यातील सक्रिय तिकिटे ({tickets?.length ?? 0}) / Active district tickets
        </h2>
        <div className="space-y-3">
          {tickets?.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="block">
              <Card className="p-4 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">{t.ticket_number}</span>
                  <TicketStatusBadge status={t.status} />
                  <Badge tone="primary">{t.current_level}</Badge>
                </div>
                <p className="mt-1 font-medium">{t.subject}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
