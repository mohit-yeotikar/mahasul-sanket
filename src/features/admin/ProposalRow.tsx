"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { reviewProposalAction } from "./actions";

interface Proposal {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  proposer: { full_name: string } | null;
}

export function ProposalRow({ proposal }: { proposal: Proposal }) {
  const { t } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  const act = (approve: boolean) =>
    start(async () => {
      const res = await reviewProposalAction(proposal.id, approve);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });

  return (
    <Card className="space-y-2 p-4">
      <p className="text-xs text-muted">
        {proposal.proposer?.full_name} · {new Date(proposal.created_at).toLocaleDateString("mr-IN")}
      </p>
      <p className="font-medium">❓ {proposal.question}</p>
      <p className="whitespace-pre-wrap text-sm">💬 {proposal.answer}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => act(true)}>
          {pending ? <Spinner /> : `✓ ${t("approve")}`}
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={() => act(false)}>
          ✕ {t("reject")}
        </Button>
      </div>
    </Card>
  );
}
