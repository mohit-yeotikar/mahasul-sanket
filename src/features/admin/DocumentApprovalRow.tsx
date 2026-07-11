"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { reviewDocumentAction } from "./actions";

interface Doc {
  id: string;
  title: string;
  doc_type: string;
  gr_number: string | null;
  created_at: string;
}

export function DocumentApprovalRow({ doc }: { doc: Doc }) {
  const { t } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  const act = (approve: boolean) =>
    start(async () => {
      const res = await reviewDocumentAction(doc.id, approve);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium">{doc.title}</p>
        <p className="text-sm text-muted">
          <Badge tone="primary">{doc.doc_type}</Badge>
          {doc.gr_number && <span className="ml-2">GR: {doc.gr_number}</span>}
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <div className="flex gap-2">
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
