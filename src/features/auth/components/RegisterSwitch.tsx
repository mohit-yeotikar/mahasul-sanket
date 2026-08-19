"use client";

// Officer/staff registration. Citizens do NOT register — they use the public
// homepage chatbox without logging in. New officer accounts wait for DCO
// verification before activation.

import Link from "next/link";
import { Card } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { RegisterForm } from "./RegisterForm";

export function RegisterSwitch() {
  const { t, lang } = useLang();

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-center text-2xl font-bold">{t("register")}</h1>
      <p className="mb-4 text-center text-sm text-muted">
        {lang === "mr" ? "अधिकारी / कर्मचारी नोंदणी" : "Officer / staff registration"}
      </p>

      <p className="mb-5 rounded-lg bg-primary/5 px-3 py-2 text-center text-xs text-muted">
        {lang === "mr"
          ? "खाते DCO पडताळणीनंतर सक्रिय होते. नागरिकांना नोंदणीची गरज नाही — थेट मुख्यपृष्ठावर विचारा."
          : "Accounts activate after DCO verification. Citizens don't register — just ask on the homepage."}
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("haveAccount")}
        </Link>
      </p>
    </Card>
  );
}
