import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TicketDetail } from "@/features/tickets/TicketDetail";

export const metadata = { title: "तिकीट | महसूल संकेत" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: ticket }, { data: replies }, { data: profile }] = await Promise.all([
    supabase.from("tickets").select("*").eq("id", id).single(),
    supabase
      .from("ticket_replies")
      .select("id,body,is_internal,created_at,author:profiles(full_name,role)")
      .eq("ticket_id", id)
      .order("created_at"),
    supabase.from("profiles").select("id,role").eq("id", user!.id).single(),
  ]);

  if (!ticket || !profile) notFound();

  return (
    <TicketDetail
      ticket={ticket}
      replies={(replies ?? []) as never}
      viewerId={profile.id}
      viewerRole={profile.role}
    />
  );
}
