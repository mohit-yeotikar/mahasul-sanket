"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

export default function PendingPage() {
  const { t } = useLang();
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Clock className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-xl font-bold">{t("pendingTitle")}</h1>
      <p className="mt-3 text-sm text-muted">{t("pendingBody")}</p>
      <Link href="/login" className="mt-6 inline-block">
        <Button variant="outline">{t("login")}</Button>
      </Link>
    </Card>
  );
}
