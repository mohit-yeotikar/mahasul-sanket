"use client";

// Citizen tool — MahaDBT scheme eligibility checker. A short rule-based
// questionnaire suggests likely-eligible farmer schemes. Guidance only; the
// citizen applies on the official MahaDBT portal.

import { useState } from "react";
import { Sprout, ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

type Land = "none" | "lt2" | "2to5" | "gt5";
type Cat = "general" | "obc" | "sc" | "st";

interface Answers { farmer: boolean | null; land: Land | null; cat: Cat | null; woman: boolean | null; }

interface Scheme {
  mr: string; en: string;
  descMr: string; descEn: string;
  ok: (a: Answers) => boolean;
}

function Choice<T>({ value, current, onClick, children }: { value: T; current: T | null; onClick: (v: T) => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
        current === value ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

const SCHEMES: Scheme[] = [
  { mr: "कृषी यांत्रिकीकरण (अवजारे अनुदान)", en: "Farm Mechanization (equipment subsidy)", descMr: "ट्रॅक्टर, अवजारे, यंत्रांवर ४०–६०% अनुदान.", descEn: "40–60% subsidy on tractors, implements, machinery.", ok: (a) => a.farmer === true && a.land !== "none" },
  { mr: "ठिबक व तुषार सिंचन", en: "Drip & Sprinkler Irrigation", descMr: "सूक्ष्म सिंचनासाठी अनुदान (अल्पभूधारकांना अधिक).", descEn: "Micro-irrigation subsidy (higher for small holders).", ok: (a) => a.farmer === true && a.land !== "none" },
  { mr: "फळबाग लागवड (भाऊसाहेब फुंडकर)", en: "Horticulture / Orchard Planting", descMr: "फळझाडे लागवडीसाठी टप्प्याटप्प्याने अनुदान.", descEn: "Phased subsidy for orchard planting.", ok: (a) => a.farmer === true && (a.land === "lt2" || a.land === "2to5") },
  { mr: "शेततळे / जलसंधारण", en: "Farm Pond / Water Conservation", descMr: "शेततळे व जलसंधारण कामांसाठी अनुदान.", descEn: "Subsidy for farm ponds & water-conservation works.", ok: (a) => a.farmer === true && a.land !== "none" },
  { mr: "बियाणे व खते अनुदान (अल्प/अत्यल्प भूधारक)", en: "Seed & Fertilizer Subsidy (small/marginal)", descMr: "अल्पभूधारक शेतकऱ्यांसाठी निविष्ठा अनुदान.", descEn: "Input subsidy for small & marginal farmers.", ok: (a) => a.farmer === true && a.land === "lt2" },
  { mr: "अनुसूचित जाती/जमाती विशेष योजना", en: "SC/ST Special Component Scheme", descMr: "अनु. जाती/जमातीच्या शेतकऱ्यांसाठी वाढीव अनुदान.", descEn: "Enhanced subsidy for SC/ST farmers.", ok: (a) => a.farmer === true && (a.cat === "sc" || a.cat === "st") },
  { mr: "महिला शेतकरी सक्षमीकरण", en: "Women Farmer Empowerment", descMr: "महिला शेतकऱ्यांसाठी प्राधान्य व वाढीव लाभ.", descEn: "Priority & enhanced benefits for women farmers.", ok: (a) => a.farmer === true && a.woman === true },
  { mr: "राष्ट्रीय अन्न सुरक्षा अभियान", en: "National Food Security Mission", descMr: "अन्नधान्य उत्पादन वाढीसाठी निविष्ठा अनुदान.", descEn: "Input support to boost food-grain production.", ok: (a) => a.farmer === true && a.land !== "none" },
];

export function EligibilityChecker() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [a, setA] = useState<Answers>({ farmer: null, land: null, cat: null, woman: null });
  const [result, setResult] = useState<Scheme[] | null>(null);

  const complete = a.farmer !== null && a.land !== null && a.cat !== null && a.woman !== null;

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">
            {result.length
              ? (M ? `तुम्ही ${result.length} योजनांसाठी पात्र असू शकता` : `You may be eligible for ${result.length} scheme(s)`)
              : (M ? "थेट जुळणारी योजना आढळली नाही" : "No direct match found")}
          </p>
          <Button size="sm" variant="outline" onClick={() => { setResult(null); }}>
            <RotateCcw className="h-4 w-4" aria-hidden />{M ? "पुन्हा" : "Restart"}
          </Button>
        </div>

        {result.map((s) => (
          <div key={s.en} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{M ? s.mr : s.en}</h3>
                <p className="mt-0.5 text-sm text-muted">{M ? s.descMr : s.descEn}</p>
              </div>
            </div>
          </div>
        ))}

        <a
          href="https://mahadbt.maharashtra.gov.in"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg hover:brightness-110"
        >
          {M ? "MahaDBT वर अर्ज करा" : "Apply on MahaDBT"}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
        <p className="text-xs text-muted">
          {M
            ? "टीप: ही केवळ मार्गदर्शक तपासणी आहे. अंतिम पात्रता MahaDBT पोर्टलवरील निकषांनुसार ठरते."
            : "Note: this is guidance only. Final eligibility is decided by the criteria on the MahaDBT portal."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Sprout className="h-4 w-4 text-primary" aria-hidden />
        {M ? "काही प्रश्नांची उत्तरे द्या — संभाव्य पात्र योजना पहा." : "Answer a few questions to see likely-eligible schemes."}
      </p>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold">{M ? "तुम्ही शेतकरी आहात का?" : "Are you a farmer?"}</p>
          <div className="flex gap-2">
            <Choice value={true} current={a.farmer} onClick={(v) => setA({ ...a, farmer: v })}>{M ? "होय" : "Yes"}</Choice>
            <Choice value={false} current={a.farmer} onClick={(v) => setA({ ...a, farmer: v })}>{M ? "नाही" : "No"}</Choice>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">{M ? "जमीन धारणा" : "Land holding"}</p>
          <div className="flex flex-wrap gap-2">
            <Choice value={"none" as Land} current={a.land} onClick={(v) => setA({ ...a, land: v })}>{M ? "नाही" : "None"}</Choice>
            <Choice value={"lt2" as Land} current={a.land} onClick={(v) => setA({ ...a, land: v })}>{M ? "< २ हे." : "< 2 ha"}</Choice>
            <Choice value={"2to5" as Land} current={a.land} onClick={(v) => setA({ ...a, land: v })}>{M ? "२–५ हे." : "2–5 ha"}</Choice>
            <Choice value={"gt5" as Land} current={a.land} onClick={(v) => setA({ ...a, land: v })}>{M ? "> ५ हे." : "> 5 ha"}</Choice>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">{M ? "प्रवर्ग" : "Category"}</p>
          <div className="flex flex-wrap gap-2">
            <Choice value={"general" as Cat} current={a.cat} onClick={(v) => setA({ ...a, cat: v })}>{M ? "खुला" : "General"}</Choice>
            <Choice value={"obc" as Cat} current={a.cat} onClick={(v) => setA({ ...a, cat: v })}>OBC</Choice>
            <Choice value={"sc" as Cat} current={a.cat} onClick={(v) => setA({ ...a, cat: v })}>SC</Choice>
            <Choice value={"st" as Cat} current={a.cat} onClick={(v) => setA({ ...a, cat: v })}>ST</Choice>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">{M ? "अर्जदार महिला आहेत का?" : "Is the applicant a woman?"}</p>
          <div className="flex gap-2">
            <Choice value={true} current={a.woman} onClick={(v) => setA({ ...a, woman: v })}>{M ? "होय" : "Yes"}</Choice>
            <Choice value={false} current={a.woman} onClick={(v) => setA({ ...a, woman: v })}>{M ? "नाही" : "No"}</Choice>
          </div>
        </div>
      </div>

      <Button disabled={!complete} onClick={() => setResult(SCHEMES.filter((s) => s.ok(a)))}>
        {M ? "पात्रता तपासा" : "Check eligibility"}
      </Button>
    </div>
  );
}
