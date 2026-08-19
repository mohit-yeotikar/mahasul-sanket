"use client";

// Public brand homepage — first fold is the logo + AI chatbox (citizens ask
// without logging in); below is what the system does and how it works, with an
// officer-login path for government staff.

import Link from "next/link";
import {
  LogIn, FileText, Mic, Ticket as TicketIcon, BookOpen, LayoutGrid, Map,
  ShieldCheck, ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/features/auth/components/LangToggle";
import { PublicChat } from "./PublicChat";

type Feat = { icon: React.ComponentType<{ className?: string }>; tmr: string; ten: string; dmr: string; den: string };

const FEATURES: Feat[] = [
  { icon: FileText, tmr: "अधिकृत उत्तरे + संदर्भ", ten: "Cited, authoritative answers",
    dmr: "प्रत्येक उत्तर संबंधित शासन निर्णय/परिपत्रकाचा संदर्भ देते — कल्पित माहिती नाही.",
    den: "Every answer cites the exact GR/circular it used — no made-up information." },
  { icon: Mic, tmr: "मराठी आवाज", ten: "Marathi voice",
    dmr: "टाइप करण्याऐवजी बोला — बोलणे थांबवताच आपोआप थांबते व मजकुरात रूपांतर होते.",
    den: "Speak instead of typing — it auto-stops when you pause and transcribes accurately." },
  { icon: TicketIcon, tmr: "तिकीट व ४-स्तरीय एस्केलेशन", ten: "Tickets & 4-level escalation",
    dmr: "उत्तर न मिळाल्यास तलाठी → नायब तहसीलदार → DCO → जिल्हा प्रशासन असे कालमर्यादेसह पुढे जाते.",
    den: "Unresolved queries escalate Talathi → Nayab Tahsildar → DCO → District Admin, with SLAs." },
  { icon: BookOpen, tmr: "ज्ञान भांडार", ten: "Living knowledge base",
    dmr: "GR, परिपत्रके, SOP एकाच ठिकाणी — मंजूर झालेली माहितीच AI वापरते.",
    den: "GRs, circulars and SOPs in one place — only approved knowledge is used by the AI." },
  { icon: LayoutGrid, tmr: "नागरिक सेवा", ten: "Citizen services",
    dmr: "७/१२, फेरफार, आपले सरकार, महाडीबीटी — अधिकृत पोर्टलचे थेट दुवे.",
    den: "7/12, ferfar, Aaple Sarkar, MahaDBT — direct links to official portals." },
  { icon: Map, tmr: "राज्यस्तरीय विश्लेषण", ten: "State-wide analytics",
    dmr: "जिल्हानिहाय नकाशा, तिकीट व कामगिरीची थेट आकडेवारी — प्रशासनासाठी.",
    den: "Live district map, ticket and performance metrics for administration." },
];

const STEPS = [
  { tmr: "विचारा", ten: "Ask", dmr: "प्रश्न टाइप करा किंवा मराठीत बोला.", den: "Type your question or speak it in Marathi." },
  { tmr: "उत्तर मिळवा", ten: "Get the answer", dmr: "अधिकृत संदर्भांसह, काही सेकंदात.", den: "Grounded in official sources, in seconds." },
  { tmr: "गरज पडल्यास तिकीट", ten: "Escalate if needed", dmr: "एका क्लिकवर वरिष्ठ अधिकाऱ्यांकडे, कालमर्यादेसह.", den: "One click sends it to a senior officer, with a timeline." },
];

export function LandingPage() {
  const { lang } = useLang();
  const M = lang === "mr";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4" aria-hidden />
                {M ? "अधिकारी प्रवेश" : "Officer Login"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — first fold: brand + chatbox */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_-5%,rgba(63,148,100,0.18),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            {M ? "महाराष्ट्र शासन · महसूल विभाग" : "Government of Maharashtra · Revenue Department"}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            {M ? "प्रत्येक महसूल प्रश्नाचं तात्काळ, अधिकृत उत्तर" : "Instant, authoritative answers to every revenue question"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            {M
              ? "शासन निर्णय व परिपत्रकांवर आधारित AI सहाय्यक — नागरिक व अधिकाऱ्यांसाठी. मराठीत विचारा किंवा बोला."
              : "An AI assistant grounded in official GRs & circulars — for citizens and officers. Ask in Marathi, by text or voice."}
          </p>

          <div className="mt-8">
            <PublicChat />
          </div>

          <p className="mt-5 text-xs text-muted">
            {M ? "✓ अधिकृत संदर्भ   ✓ मराठी आवाज   ✓ मोफत, लॉगिनशिवाय" : "✓ Cited sources   ✓ Marathi voice   ✓ Free, no login"}
          </p>
        </div>
      </section>

      {/* What it does */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{M ? "ही प्रणाली काय करते" : "What this system does"}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted">
          {M
            ? "गावातील तलाठ्यापासून जिल्हा प्रशासनापर्यंत — एकच विश्वासार्ह, अधिकृत ज्ञान व्यासपीठ."
            : "One trusted, official knowledge platform — from the village Talathi to district administration."}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.ten} className="rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold">{M ? f.tmr : f.ten}</h3>
              <p className="mt-1.5 text-sm text-muted">{M ? f.dmr : f.den}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{M ? "कसे वापरायचे" : "How it works"}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-fg">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{M ? s.tmr : s.ten}</h3>
                <p className="mt-1.5 text-sm text-muted">{M ? s.dmr : s.den}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Officer CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{M ? "अधिकारी किंवा कर्मचारी आहात?" : "Are you an officer or staff member?"}</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted">
          {M
            ? "तलाठी, मंडळ अधिकारी, तहसील व जिल्हा प्रशासनासाठी संपूर्ण डॅशबोर्ड, तिकीट प्रणाली व विश्लेषण."
            : "Full dashboards, ticketing and analytics for Talathi, Circle Officer, Tahsil and District administration."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button size="lg">
              <LogIn className="h-5 w-5" aria-hidden />
              {M ? "प्रवेश करा" : "Sign in"}
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              {M ? "नवीन नोंदणी" : "Register"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <Logo className="justify-center" />
          <p className="mx-auto mt-3 max-w-md text-xs text-muted">
            {M
              ? "महाराष्ट्र शासन, महसूल विभाग — AI ज्ञान सहाय्यक. (प्रात्यक्षिक आवृत्ती)"
              : "Government of Maharashtra, Revenue Department — AI Knowledge Assistant. (Demo build)"}
          </p>
        </div>
      </footer>
    </div>
  );
}
