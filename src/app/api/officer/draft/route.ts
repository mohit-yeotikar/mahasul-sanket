import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/ai/draft";
import { rateLimit } from "@/lib/rate-limit";

const STAFF = ["talathi", "circle_officer", "nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];
const bodySchema = z.object({
  type: z.string().min(2).max(40),
  fields: z.record(z.string(), z.string().max(2000)),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !STAFF.includes(me.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`draft:${user.id}`, 12, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const draft = await generateDraft(parsed.data.type, parsed.data.fields);
    return NextResponse.json({ draft });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Draft failed" }, { status: 502 });
  }
}
