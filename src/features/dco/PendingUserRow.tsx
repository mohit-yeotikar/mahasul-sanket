"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { verifyUserAction } from "@/features/admin/actions";

interface PendingUser {
  id: string;
  full_name: string;
  mobile: string;
  government_id: string;
  created_at: string;
  taluka: { name_mr: string; name_en: string } | null;
}

export function PendingUserRow({ user }: { user: PendingUser }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  const act = (approve: boolean) =>
    start(async () => {
      const res = await verifyUserAction(user.id, approve);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-semibold">{user.full_name}</p>
        <p className="text-sm text-muted">
          📱 {user.mobile} · 🪪 {user.government_id}
          {user.taluka && ` · ${lang === "mr" ? user.taluka.name_mr : user.taluka.name_en}`}
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => act(true)}>
          {pending ? <Spinner /> : `✓ ${t("verify")}`}
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={() => act(false)}>
          ✕ {t("reject")}
        </Button>
      </div>
    </Card>
  );
}
