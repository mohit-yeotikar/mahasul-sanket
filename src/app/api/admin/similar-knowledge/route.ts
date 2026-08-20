import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// AI-assisted knowledge approval: before an admin approves a document/proposal,
// surface EXISTING approved knowledge that looks similar (possible duplicate or
// conflict). Uses the Postgres keyword search (no embeddings needed).

const ALLOWED = ["dco", "district_admin", "state_admin", "super_admin"];
const bodySchema = z.object({
  text: z.string().trim().min(4).max(1000),
  excludeDocId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin.rpc("search_knowledge_keyword", {
    query_text: parsed.data.text,
    match_count: 8,
  });

  type Row = { document_id: string; title: string; gr_number: string | null; content: string; similarity: number };
  const seen = new Set<string>();
  const matches = ((data ?? []) as Row[])
    .filter((r) => r.document_id !== parsed.data.excludeDocId && (r.similarity ?? 0) >= 0.15)
    .filter((r) => (seen.has(r.document_id) ? false : (seen.add(r.document_id), true)))
    .slice(0, 3)
    .map((r) => ({
      document_id: r.document_id,
      title: r.title,
      gr_number: r.gr_number,
      similarity: Math.round((r.similarity ?? 0) * 100),
      snippet: (r.content ?? "").slice(0, 160),
    }));

  return NextResponse.json({ matches });
}
