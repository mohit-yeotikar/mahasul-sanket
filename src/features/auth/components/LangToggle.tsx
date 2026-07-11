"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Change language / भाषा बदला"
      onClick={() => setLang(lang === "mr" ? "en" : "mr")}
    >
      {lang === "mr" ? "English" : "मराठी"}
    </Button>
  );
}
