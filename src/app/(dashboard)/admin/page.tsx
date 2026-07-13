import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UploadDocumentForm } from "@/features/admin/UploadDocumentForm";
import { ProposalRow } from "@/features/admin/ProposalRow";
import { DocumentApprovalRow } from "@/features/admin/DocumentApprovalRow";
import { Card } from "@/components/ui";

export const metadata = { title: "प्रशासन | महसूल संकेत" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const canBulk = me?.role === "super_admin" || me?.role === "state_admin";

  const [{ data: proposals }, { data: pendingDocs }] = await Promise.all([
    supabase
      .from("knowledge_proposals")
      .select("id,question,answer,created_at,proposer:profiles!knowledge_proposals_proposed_by_fkey(full_name)")
      .eq("status", "proposed")
      .order("created_at"),
    supabase
      .from("documents")
      .select("id,title,doc_type,gr_number,created_at")
      .eq("status", "pending_approval")
      .order("created_at"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">प्रशासन / Admin</h1>

      {canBulk && (
        <Link href="/admin/bulk" className="block">
          <Card className="flex items-center gap-4 border-primary/30 bg-primary/5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg">
              <Layers className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">बल्क दस्तऐवज अपलोड / Bulk upload (Super Admin)</p>
              <p className="text-sm text-muted">
                अनेक GR एकत्र अपलोड करा — AI आपोआप ओळख, शीर्षक, प्रकार व डुप्लिकेट तपासणी करतो.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </Card>
        </Link>
      )}

      <section>
        <h2 className="mb-3 font-semibold">दस्तऐवज अपलोड / Upload GR · Circular · FAQ</h2>
        <UploadDocumentForm />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">
          ज्ञान प्रस्ताव मंजुरी ({proposals?.length ?? 0}) / Knowledge proposals
        </h2>
        {!proposals?.length && (
          <Card className="p-6 text-center text-sm text-muted">प्रलंबित प्रस्ताव नाहीत.</Card>
        )}
        <div className="space-y-3">
          {proposals?.map((p) => <ProposalRow key={p.id} proposal={p as never} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">
          दस्तऐवज मंजुरी ({pendingDocs?.length ?? 0}) / Document approvals
        </h2>
        {!pendingDocs?.length && (
          <Card className="p-6 text-center text-sm text-muted">प्रलंबित दस्तऐवज नाहीत.</Card>
        )}
        <div className="space-y-3">
          {pendingDocs?.map((d) => <DocumentApprovalRow key={d.id} doc={d as never} />)}
        </div>
      </section>
    </div>
  );
}
