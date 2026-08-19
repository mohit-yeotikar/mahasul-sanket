"use client";

// Public citizen toolkit — no login. Hosts the self-service tools with a light
// government-branded header. Linked from the homepage.

import { useState } from "react";
import Link from "next/link";
import { Phone, FileText, Sprout, ListChecks, Megaphone, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/features/auth/components/LangToggle";
import { Reveal } from "@/components/motion";
import { FindOfficer } from "./FindOfficer";
import { DocumentChecklist } from "./DocumentChecklist";
import { EligibilityChecker } from "./EligibilityChecker";
import { StatusTracker } from "./StatusTracker";
import { Grievance } from "./Grievance";

type TabKey = "officer" | "checklist" | "eligibility" | "status" | "grievance";

const TABS: { key: TabKey; icon: React.ComponentType<{ className?: string }>; mr: string; en: string; wide?: boolean }[] = [
  { key: "officer", icon: Phone, mr: "तुमचा तलाठी शोधा", en: "Find your Talathi" },
  { key: "checklist", icon: FileText, mr: "कागदपत्रांची यादी", en: "Document checklist" },
  { key: "eligibility", icon: Sprout, mr: "योजना पात्रता", en: "Scheme eligibility" },
  { key: "status", icon: ListChecks, mr: "अर्ज स्थिती", en: "Application status" },
  { key: "grievance", icon: Megaphone, mr: "तक्रार नोंदवा", en: "File a grievance", wide: true },
];

export function ToolsHub() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [tab, setTab] = useState<TabKey>("officer");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ff9933_33%,#ffffff_33%,#ffffff_66%,#138808_66%,#138808_100%)]" aria-hidden />
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" aria-label="Home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{M ? "मुख्यपृष्ठ" : "Home"}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Reveal className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{M ? "नागरिक साधने" : "Citizen tools"}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{M ? "स्वतः करा — मोफत सेवा" : "Self-service — free tools"}</h1>
        </Reveal>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition-all ${
                  t.wide ? "col-span-2 sm:col-span-1" : ""
                } ${
                  active ? "border-primary bg-primary text-primary-fg shadow-md" : "border-border bg-surface hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <t.icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="leading-tight">{M ? t.mr : t.en}</span>
              </button>
            );
          })}
        </div>

        <Reveal key={tab} className="rounded-3xl border border-border bg-surface/60 p-5 backdrop-blur sm:p-6">
          {tab === "officer" && <FindOfficer />}
          {tab === "checklist" && <DocumentChecklist />}
          {tab === "eligibility" && <EligibilityChecker />}
          {tab === "status" && <StatusTracker />}
          {tab === "grievance" && <Grievance />}
        </Reveal>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} {M ? "महाराष्ट्र शासन, महसूल विभाग — प्रात्यक्षिक आवृत्ती." : "Government of Maharashtra, Revenue Department — demo build."}
        </div>
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ff9933_33%,#ffffff_33%,#ffffff_66%,#138808_66%,#138808_100%)]" aria-hidden />
      </footer>
    </div>
  );
}
