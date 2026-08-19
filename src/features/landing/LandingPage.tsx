"use client";

// Public brand homepage — official government identity (tricolor strip +
// leadership), a premium hero with the AI chatbox in the first fold, then value
// sections and an officer-login path. Fully responsive, theme-aware.

import Link from "next/link";
import {
  LogIn, FileText, Mic, Ticket as TicketIcon, BookOpen, LayoutGrid, Map,
  ShieldCheck, ArrowRight, BadgeCheck, Languages, Clock,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/features/auth/components/LangToggle";
import { Leadership } from "./Leadership";
import { PublicChat } from "./PublicChat";

type Feat = { icon: React.ComponentType<{ className?: string }>; tmr: string; ten: string; dmr: string; den: string };

const FEATURES: Feat[] = [
  { icon: FileText, tmr: "अधिकृत उत्तरे + संदर्भ", ten: "Cited, authoritative answers",
    dmr: "प्रत्येक उत्तर संबंधित शासन निर्णय/परिपत्रकाचा संदर्भ देते — कल्पित माहिती नाही.",
    den: "Every answer cites the exact GR/circular it used — never invented." },
  { icon: Mic, tmr: "मराठी आवाज", ten: "Marathi voice",
    dmr: "टाइप न करता बोला — बोलणे थांबवताच आपोआप थांबते व अचूक मजकुरात रूपांतर होते.",
    den: "Speak instead of typing — auto-stops when you pause and transcribes accurately." },
  { icon: TicketIcon, tmr: "तिकीट व ४-स्तरीय एस्केलेशन", ten: "Tickets & 4-level escalation",
    dmr: "उत्तर न मिळाल्यास तलाठी → नायब तहसीलदार → DCO → जिल्हा प्रशासन असे कालमर्यादेसह.",
    den: "Unresolved queries escalate Talathi → Nayab Tahsildar → DCO → District Admin, with SLAs." },
  { icon: BookOpen, tmr: "ज्ञान भांडार", ten: "Living knowledge base",
    dmr: "GR, परिपत्रके, SOP एकाच ठिकाणी — मंजूर झालेली माहितीच AI वापरते.",
    den: "GRs, circulars and SOPs in one place — only approved knowledge is used." },
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
  { tmr: "गरज पडल्यास तिकीट", ten: "Escalate if needed", dmr: "एका क्लिकवर वरिष्ठ अधिकाऱ्यांकडे, कालमर्यादेसह.", den: "One click to a senior officer, with a timeline." },
];

export function LandingPage() {
  const { lang } = useLang();
  const M = lang === "mr";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Tricolor government strip */}
      <div className="h-1 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ff9933_33%,#ffffff_33%,#ffffff_66%,#138808_66%,#138808_100%)]" aria-hidden />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-medium text-muted">
          <span>{M ? "भारत सरकार · महाराष्ट्र शासन" : "Government of India · Government of Maharashtra"}</span>
          <span className="hidden sm:inline">{M ? "महसूल व वन विभाग" : "Revenue & Forest Department"}</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{M ? "अधिकारी प्रवेश" : "Officer Login"}</span>
                <span className="sm:hidden">{M ? "प्रवेश" : "Login"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Leadership */}
      <Leadership />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_-8%,rgba(63,148,100,0.20),transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.4] [background-image:radial-gradient(rgba(26,92,56,0.10)_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {M ? "शासन निर्णयांवर आधारित · अधिकृत" : "Grounded in official GRs · Authoritative"}
          </div>
          <h1 className="text-[2rem] font-extrabold leading-[1.15] tracking-tight sm:text-[3rem]">
            {M ? "गावातील प्रत्येक महसूल प्रश्नाचं" : "Instant, authoritative answers"}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {M ? " तात्काळ, अधिकृत उत्तर" : " to every revenue question"}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            {M
              ? "तलाठ्यांपासून नागरिकांपर्यंत — शासन निर्णय व परिपत्रकांवर आधारित AI सहाय्यक. मराठीत विचारा किंवा बोला."
              : "For Talathis to citizens — an AI assistant grounded in official GRs & circulars. Ask in Marathi, by text or voice."}
          </p>

          <div className="mt-9">
            <PublicChat />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" aria-hidden />{M ? "अधिकृत संदर्भ" : "Cited sources"}</span>
            <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4 text-primary" aria-hidden />{M ? "मराठी आवाज" : "Marathi voice"}</span>
            <span className="inline-flex items-center gap-1.5"><Languages className="h-4 w-4 text-primary" aria-hidden />{M ? "मराठी + इंग्रजी" : "Marathi + English"}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" aria-hidden />{M ? "२४×७ · मोफत" : "24×7 · Free"}</span>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{M ? "ही प्रणाली काय करते" : "What this system does"}</h2>
          <p className="mt-3 text-muted">
            {M
              ? "गावातील तलाठ्यापासून जिल्हा प्रशासनापर्यंत — एकच विश्वासार्ह, अधिकृत ज्ञान व्यासपीठ."
              : "One trusted, official knowledge platform — from the village Talathi to district administration."}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.ten} className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary transition-colors group-hover:from-primary group-hover:to-secondary group-hover:text-primary-fg">
                <f.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{M ? f.tmr : f.ten}</h3>
              <p className="mt-1.5 text-sm text-muted">{M ? f.dmr : f.den}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{M ? "कसे वापरायचे" : "How it works"}</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-fg shadow-md shadow-primary/20">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{M ? s.tmr : s.ten}</h3>
                <p className="mt-1.5 text-sm text-muted">{M ? s.dmr : s.den}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Officer CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary px-6 py-12 text-center text-primary-fg shadow-xl sm:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" aria-hidden />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">{M ? "अधिकारी किंवा कर्मचारी आहात?" : "Are you an officer or staff member?"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-fg/90">
              {M
                ? "तलाठी, मंडळ अधिकारी, तहसील व जिल्हा प्रशासनासाठी संपूर्ण डॅशबोर्ड, तिकीट प्रणाली व राज्यस्तरीय विश्लेषण."
                : "Full dashboards, ticketing and state-wide analytics for Talathi, Circle Officer, Tahsil and District administration."}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <LogIn className="h-5 w-5" aria-hidden />
                  {M ? "प्रवेश करा" : "Sign in"}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white/10">
                  {M ? "नवीन नोंदणी" : "Register"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted">
              {M
                ? "महाराष्ट्र शासन, महसूल विभागाचा AI ज्ञान सहाय्यक — शासन निर्णय व परिपत्रकांवर आधारित अचूक, अधिकृत मार्गदर्शन."
                : "The Maharashtra Revenue Department's AI knowledge assistant — accurate, authoritative guidance grounded in official GRs & circulars."}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">{M ? "अधिकारी प्रवेश" : "Officer Login"}</Link>
              <a href="https://bhulekh.mahabhumi.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground">{M ? "महाभूलेख ७/१२" : "Mahabhulekh 7/12"}</a>
              <a href="https://aaplesarkar.mahaonline.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground">{M ? "आपले सरकार" : "Aaple Sarkar"}</a>
              <a href="https://igrmaharashtra.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground">IGR</a>
            </div>
            <p className="mt-4 text-xs text-muted">
              © {new Date().getFullYear()} {M ? "महाराष्ट्र शासन, महसूल विभाग." : "Government of Maharashtra, Revenue Department."}
              <br />{M ? "प्रात्यक्षिक आवृत्ती." : "Demo build."}
            </p>
          </div>
        </div>
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ff9933_33%,#ffffff_33%,#ffffff_66%,#138808_66%,#138808_100%)]" aria-hidden />
      </footer>
    </div>
  );
}
