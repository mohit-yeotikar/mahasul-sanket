import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { triageTicket } from "@/lib/ai/triage";
import { rateLimit } from "@/lib/rate-limit";

const OFFICER_ROLES = ["nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];
const bodySchema = z.object({ ticketId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !OFFICER_ROLES.includes(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!rateLimit(`triage:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // RLS ensures the officer can only read tickets in their scope.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("subject, description")
    .eq("id", parsed.data.ticketId)
    .single();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  try {
    const result = await triageTicket(ticket.subject, ticket.description);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Triage failed" },
      { status: 502 }
    );
  }
}
