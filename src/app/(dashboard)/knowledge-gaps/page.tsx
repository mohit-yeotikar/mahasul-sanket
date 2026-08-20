import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, TrendingDown, ThumbsDown, Upload, ArrowRight, FileWarning } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";
export const metadata = { title: "ज्ञान त्रुटी अहवाल | महसूल संकेत" };

const ALLOWED = ["dco", "district_admin", "state_admin", "super_admin"];
const LOW_CONF = 60;

export default async function KnowledgeGapsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role)) redirect("/dashboard");

  const admin = createAdminClient();
  const [{ data: tickets }, { count: lowConfCount }, { data: unhelpful }] = await Promise.all([
    admin
      .from("tickets")
      .select("category, ai_confidence, source_question, subject, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "assistant")
      .lt("confidence", LOW_CONF),
    admin
      .from("feedback")
      .select("comment, created_at, message:messages(content)")
      .eq("is_helpful", false)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = tickets ?? [];

  // Gap ranking by category (tickets = escalated / low-confidence questions).
  const byCat = new Map<string, number>();
  for (const t of rows) byCat.set(t.category, (byCat.get(t.category) ?? 0) + 1);
  const ranked = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = ranked[0]?.[1] ?? 1;

  // Specific weak questions (lowest confidence first).
  const weak = rows
    .filter((t) => t.source_question && t.ai_confidence != null)
    .sort((a, b) => (a.ai_confidence ?? 0) - (b.ai_confidence ?? 0))
    .slice(0, 12);

  const unhelpfulRows = (unhelpful ?? []) as unknown as { comment: string | null; created_at: string; message: { content: string } | null }[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <FileWarning className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold">ज्ञान त्रुटी अहवाल / Knowledge-gap report</h1>
          <p className="text-sm text-muted">
            कोणत्या विषयांवर AI ला कमी विश्वास आहे — तिथे शासन निर्णय अपलोड करा. / Where the AI is least confident — upload GRs there.
          </p>
        </div>
      </div>

      {/* Signal metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { icon: AlertTriangle, label: "एस्केलेट झालेले प्रश्न / Escalated questions", value: rows.length, tone: "bg-accent/12 text-accent" },
          { icon: TrendingDown, label: `कमी-विश्वास उत्तरे (<${LOW_CONF}%) / Low-confidence answers`, value: lowConfCount ?? 0, tone: "bg-warning/12 text-warning" },
          { icon: ThumbsDown, label: "असमाधानकारक अभिप्राय / Unhelpful feedback", value: unhelpfulRows.length, tone: "bg-danger/12 text-danger" },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${m.tone}`}>
              <m.icon className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-3xl font-bold tabular-nums">{m.value}</p>
            <p className="mt-1 text-sm text-muted">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Topics needing GRs */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">विषयनिहाय त्रुटी / Gaps by topic</h2>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <Upload className="h-4 w-4" aria-hidden /> GR अपलोड करा
          </Link>
        </div>
        {!ranked.length && <p className="py-6 text-center text-sm text-muted">पुरेसा डेटा नाही. / Not enough data yet.</p>}
        <div className="space-y-3">
          {ranked.map(([cat, count]) => (
            <div key={cat}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{CATEGORY_LABELS[cat]?.mr ?? cat} <span className="text-muted">/ {CATEGORY_LABELS[cat]?.en ?? cat}</span></span>
                <span className="tabular-nums text-muted">{count}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-warning"
                  style={{ width: `${Math.max(6, Math.round((count / maxCat) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Specific weak questions */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">सर्वात कमी विश्वासाचे प्रश्न / Lowest-confidence questions</h2>
        {!weak.length && <p className="py-6 text-center text-sm text-muted">कमी-विश्वास नोंदी नाहीत. / No low-confidence records.</p>}
        <ul className="space-y-2">
          {weak.map((t, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-surface-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.source_question}</p>
                <p className="mt-0.5 text-xs text-muted">{CATEGORY_LABELS[t.category]?.mr ?? t.category}</p>
              </div>
              <Badge tone={(t.ai_confidence ?? 0) < 40 ? "danger" : "warning"}>{Math.round(t.ai_confidence ?? 0)}%</Badge>
            </li>
          ))}
        </ul>
      </Card>

      {/* Unhelpful feedback */}
      {!!unhelpfulRows.length && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">असमाधानकारक उत्तरे / Answers marked unhelpful</h2>
          <ul className="space-y-2">
            {unhelpfulRows.map((f, i) => (
              <li key={i} className="rounded-lg bg-surface-2/60 p-3 text-sm">
                {f.comment && <p className="font-medium">“{f.comment}”</p>}
                {f.message?.content && <p className="mt-1 line-clamp-2 text-muted">{f.message.content}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg hover:brightness-110">
        <Upload className="h-4 w-4" aria-hidden /> संबंधित GR अपलोड करा / Upload the missing GRs
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
