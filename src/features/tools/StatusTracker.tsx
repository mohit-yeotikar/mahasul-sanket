"use client";

// Citizen tool — application / ferfar status tracker. This is a DEMO tracker:
// there is no live integration with Mahabhulekh yet, so it shows an
// illustrative timeline (clearly labelled) for any reference number entered.

import { useState } from "react";
import { Search, CheckCircle2, Loader2, Circle, Info } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

const STAGES = [
  { mr: "अर्ज प्राप्त झाला", en: "Application received" },
  { mr: "छाननी सुरू", en: "Under scrutiny" },
  { mr: "नोटीस / हरकत कालावधी", en: "Notice / objection period" },
  { mr: "मंडळ अधिकारी निर्णय", en: "Circle Officer decision" },
  { mr: "नोंद पूर्ण", en: "Entry certified" },
];

export function StatusTracker() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [ref, setRef] = useState("");
  const [stage, setStage] = useState<number | null>(null);

  const track = () => {
    const clean = ref.trim();
    if (clean.length < 4) return;
    // Deterministic demo stage from the reference string.
    const sum = [...clean].reduce((n, c) => n + c.charCodeAt(0), 0);
    setStage(sum % STAGES.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-accent/25 bg-accent-soft p-3 text-xs text-accent">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {M
          ? "प्रात्यक्षिक: थेट महाभूलेख जोडणी लवकरच. सध्या हे उदाहरणादाखल स्थिती दर्शवते."
          : "Demo: live Mahabhulekh integration is coming. For now this shows an illustrative status."}
      </div>

      <div className="flex gap-2">
        <Input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && track()}
          placeholder={M ? "अर्ज / फेरफार क्रमांक (उदा. FF-2026-00123)" : "Application / ferfar no. (e.g. FF-2026-00123)"}
        />
        <Button onClick={track} disabled={ref.trim().length < 4}>
          <Search className="h-4 w-4" aria-hidden />{M ? "पहा" : "Track"}
        </Button>
      </div>

      {stage !== null && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">
            {M ? "क्रमांक" : "Reference"}: <span className="font-mono font-semibold text-foreground">{ref.trim()}</span>
          </p>
          <ol className="mt-4 space-y-0">
            {STAGES.map((s, i) => {
              const done = i < stage;
              const current = i === stage;
              return (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
                    ) : current ? (
                      <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden />
                    ) : (
                      <Circle className="h-6 w-6 text-border" aria-hidden />
                    )}
                    {i < STAGES.length - 1 && <span className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} style={{ minHeight: 24 }} />}
                  </div>
                  <div className={`pb-5 ${current ? "" : done ? "" : "opacity-50"}`}>
                    <p className={`text-sm font-semibold ${current ? "text-accent" : ""}`}>{M ? s.mr : s.en}</p>
                    <p className="text-xs text-muted">
                      {done ? (M ? "पूर्ण" : "Completed") : current ? (M ? "सुरू आहे" : "In progress") : (M ? "प्रलंबित" : "Pending")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
