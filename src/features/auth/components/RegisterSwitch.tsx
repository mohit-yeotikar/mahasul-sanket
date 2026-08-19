"use client";

// Registration entry point — choose Citizen (public) or Officer (govt staff).
// Citizens get instant access; officers wait for DCO verification.

import { useState } from "react";
import Link from "next/link";
import { Landmark, UserRound } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { RegisterForm } from "./RegisterForm";
import { CitizenRegisterForm } from "./CitizenRegisterForm";

type Audience = "citizen" | "officer";

export function RegisterSwitch() {
  const { t, lang } = useLang();
  const [audience, setAudience] = useState<Audience>("citizen");

  const tabs: { key: Audience; icon: typeof UserRound; mr: string; en: string }[] = [
    { key: "citizen", icon: UserRound, mr: "नागरिक", en: "Citizen" },
    { key: "officer", icon: Landmark, mr: "अधिकारी / कर्मचारी", en: "Officer / Staff" },
  ];

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-center text-2xl font-bold">{t("register")}</h1>
      <p className="mb-5 text-center text-sm text-muted">{t("appName")}</p>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setAudience(tab.key)}
            aria-pressed={audience === tab.key}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              audience === tab.key
                ? "bg-surface text-primary shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            {lang === "mr" ? tab.mr : tab.en}
          </button>
        ))}
      </div>

      <p className="mb-5 rounded-lg bg-primary/5 px-3 py-2 text-center text-xs text-muted">
        {audience === "citizen"
          ? lang === "mr"
            ? "नागरिकांना लगेच प्रवेश मिळतो — शासकीय ओळखपत्राची गरज नाही."
            : "Citizens get instant access — no Government ID needed."
          : lang === "mr"
            ? "अधिकारी/कर्मचारी खाते DCO पडताळणीनंतर सक्रिय होते."
            : "Officer/staff accounts are activated after DCO verification."}
      </p>

      {audience === "citizen" ? <CitizenRegisterForm /> : <RegisterForm />}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("haveAccount")}
        </Link>
      </p>
    </Card>
  );
}
