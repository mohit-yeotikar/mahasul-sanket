"use client";

// Public CITIZEN homepage. Content is written for ordinary people getting
// information & services — not the officer workflow. Officer features live in a
// small separate strip.
//
// Folds: hero (chatbox centerpiece) → leadership → impact stats → service bento
// → campaign → citizen benefits → officer strip → footer. Every card grid holds
// an EVEN number of tiles (bento 8, benefits 4, stats 6). Motion via framer-
// motion + CSS, all reduced-motion aware.

import Link from "next/link";
import {
  LogIn, FileText, Map, ClipboardList, Sprout, FileSignature, Building2, Stamp,
  HandCoins, ArrowRight, ArrowUpRight, BadgeCheck, Mic, Languages,
  Clock, Megaphone, LayoutDashboard, Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/features/auth/components/LangToggle";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Leadership } from "./Leadership";
import { PublicChat } from "./PublicChat";
import { ImpactStats } from "./ImpactStats";
import { CoverageMap } from "./CoverageMap";
import { MaharashtraSilhouette } from "./MaharashtraSilhouette";

type Service = {
  icon: React.ComponentType<{ className?: string }>;
  mr: string; en: string; dmr: string; den: string;
  url?: string; ask?: string; wide?: boolean;
};

// A citizen's real needs — each tile either opens the official portal or asks
// the AI (via the "ms-ask" event the chatbox listens for).
const SERVICES: Service[] = [
  { icon: FileText, mr: "७/१२ व ८अ उतारा", en: "7/12 & 8A Extract", dmr: "तुमचा डिजिटल जमीन अभिलेख पहा व डाउनलोड करा", den: "View & download your digital land record", url: "https://bhulekh.mahabhumi.gov.in", wide: true },
  { icon: ClipboardList, mr: "फेरफार म्हणजे काय?", en: "What is Ferfar?", dmr: "नावात बदल व वारस नोंद प्रक्रिया — AI ला विचारा", den: "Mutation & name-change process — ask the AI", ask: "फेरफार नोंदीची प्रक्रिया काय आहे आणि किती दिवस लागतात?" },
  { icon: Sprout, mr: "ई-पीक पाहणी", en: "e-Peek Pahani", dmr: "मोबाइलवरून पीक नोंदणी कशी करायची", den: "How to record your crop from mobile", ask: "ई-पीक पाहणी मोबाइल ॲपवरून कशी करायची?" },
  { icon: FileSignature, mr: "डिजिटल स्वाक्षरीत ७/१२", en: "Signed 7/12", dmr: "अधिकृत स्वाक्षरीत उतारा", den: "Officially signed extract", url: "https://digitalsatbara.mahabhumi.gov.in/DSLR" },
  { icon: Building2, mr: "दाखले (आपले सरकार)", en: "Certificates (RTS)", dmr: "रहिवासी, उत्पन्न, जात दाखले", den: "Domicile, income, caste certificates", url: "https://aaplesarkar.mahaonline.gov.in" },
  { icon: Map, mr: "जमीन नकाशा", en: "Land Map", dmr: "गट / सर्व्हे नकाशा पहा", den: "View survey/parcel map", url: "https://mahabhunakasha.mahabhumi.gov.in" },
  { icon: Stamp, mr: "दस्त नोंदणी / मुद्रांक", en: "Registration & Stamps", dmr: "IGR / SARITA — ई-सर्च व मुद्रांक", den: "IGR/SARITA — e-Search & stamp duty", url: "https://igrmaharashtra.gov.in" },
  { icon: HandCoins, mr: "शेतकरी योजना", en: "Farmer Schemes", dmr: "MahaDBT — लाभ व अर्ज", den: "MahaDBT — benefits & applications", url: "https://mahadbt.maharashtra.gov.in" },
];

type Benefit = { icon: React.ComponentType<{ className?: string }>; tmr: string; ten: string; dmr: string; den: string };
const BENEFITS: Benefit[] = [
  { icon: BadgeCheck, tmr: "अधिकृत व अचूक", ten: "Official & accurate", dmr: "उत्तरे शासन निर्णय व परिपत्रकांवर आधारित — संदर्भासह.", den: "Answers grounded in official GRs & circulars — with citations." },
  { icon: Mic, tmr: "मराठी आवाज", ten: "Marathi voice", dmr: "बोला, टाइप करण्याची गरज नाही — बोलणे थांबवताच आपोआप थांबते.", den: "Just speak — it auto-stops when you pause." },
  { icon: Languages, tmr: "सर्व सेवा एका ठिकाणी", ten: "Everything in one place", dmr: "महाभूलेख, आपले सरकार, IGR, MahaDBT — थेट दुवे.", den: "Mahabhulekh, Aaple Sarkar, IGR, MahaDBT — direct links." },
  { icon: Clock, tmr: "मोफत · २४×७", ten: "Free · 24×7", dmr: "लॉगिनशिवाय, कधीही, कुठूनही — मोबाइल व संगणकावर.", den: "No login, anytime, anywhere — mobile & desktop." },
];

function ask(q: string) {
  window.dispatchEvent(new CustomEvent("ms-ask", { detail: q }));
}

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
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
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

      {/* ── Fold 1 — Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* layered backdrop: aurora mesh + dot grid + state silhouette */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="ms-aurora absolute -top-48 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(63,148,100,0.30),transparent_60%)] blur-3xl" />
          <div className="ms-aurora absolute -top-16 right-[6%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(224,123,0,0.12),transparent_62%)] blur-3xl" style={{ animationDelay: "-7s" }} />
          <div className="ms-aurora absolute top-16 left-[2%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(26,92,56,0.20),transparent_62%)] blur-3xl" style={{ animationDelay: "-13s" }} />
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(26,92,56,0.10)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(90%_60%_at_50%_0%,#000,transparent_78%)]" />
          <MaharashtraSilhouette className="absolute right-[-10%] top-6 h-[26rem] w-auto text-primary/[0.05] sm:right-[-2%] sm:h-[32rem]" />
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-14 pt-14 text-center sm:pt-20">
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {M ? "नागरिकांसाठी · मोफत · मराठीत" : "For citizens · Free · in Marathi"}
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-[2.05rem] font-extrabold leading-[1.14] tracking-tight sm:text-[3.25rem]">
              {M ? "महसूल सेवांची माहिती," : "Land & revenue answers,"}
              <br className="hidden sm:block" />
              <span className="ms-kinetic bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {M ? " तुमच्या भाषेत, काही क्षणांमध्ये!" : " in your language, in moments!"}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
              {M
                ? "७/१२, फेरफार, वारस नोंद, दाखले, पीक पाहणी — AI ला मराठीत विचारा किंवा खालील सेवा थेट वापरा."
                : "7/12, mutation, inheritance, certificates, crop entry — ask the AI in Marathi, or use a service below directly."}
            </p>
          </Reveal>

          <Reveal delay={0.18} className="mt-9">
            <PublicChat />
          </Reveal>

          <Reveal delay={0.26}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" aria-hidden />{M ? "अधिकृत माहिती" : "Official info"}</span>
              <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4 text-primary" aria-hidden />{M ? "मराठी आवाज" : "Marathi voice"}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" aria-hidden />{M ? "मोफत · लॉगिनशिवाय" : "Free · no login"}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Fold 2 — Leadership ───────────────────────────────── */}
      <Leadership />

      {/* ── Impact stats band (GOAL 2) ────────────────────────── */}
      <ImpactStats />

      {/* ── Live coverage — interactive Maharashtra map ───────── */}
      <CoverageMap />

      {/* ── Quick services — bento ────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <Reveal className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{M ? "सेवा" : "Services"}</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{M ? "तुम्हाला काय हवं आहे?" : "What do you need?"}</h2>
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" gap={0.06} amount={0.1}>
          {SERVICES.map((s) => {
            const inner = (
              <>
                <div className={`flex items-center justify-center rounded-2xl transition-colors ${s.wide ? "h-12 w-12 bg-white/15 text-white" : "h-11 w-11 bg-gradient-to-br from-primary/15 to-secondary/10 text-primary group-hover:from-primary group-hover:to-secondary group-hover:text-primary-fg"}`}>
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="mt-3 flex items-start gap-1.5">
                  <h3 className={`font-semibold leading-snug ${s.wide ? "text-lg text-white" : ""}`}>{M ? s.mr : s.en}</h3>
                  {s.url ? <ArrowUpRight className={`mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${s.wide ? "text-white/80" : "text-muted group-hover:text-primary"}`} aria-hidden />
                    : <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />}
                </div>
                <p className={`mt-1 text-sm ${s.wide ? "text-white/85" : "text-muted"}`}>{M ? s.dmr : s.den}</p>
              </>
            );
            const cls = `group flex h-full w-full flex-col rounded-3xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
              s.wide ? "border-transparent bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20 hover:shadow-xl"
                     : "border-border bg-surface/70 backdrop-blur hover:border-primary/30 hover:shadow-lg"
            }`;
            return (
              <StaggerItem key={s.en} className={s.wide ? "col-span-2" : ""}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                ) : (
                  <button onClick={() => ask(s.ask!)} className={cls}>{inner}</button>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* Campaign announcement */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4">
        <Reveal>
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-accent/25 bg-accent-soft p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Megaphone className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {M ? "छत्रपती शिवाजी महाराज महाराजस्व अभियान" : "Chhatrapati Shivaji Maharaj Maharajaswa Abhiyan"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {M ? "गावोगावी महसूल सेवा शिबिरे — दाखले, फेरफार, सातबारा दुरुस्ती एकाच ठिकाणी." : "Village-level revenue service camps — certificates, mutations and 7/12 corrections in one place."}
              </p>
            </div>
            <Button variant="accent" size="sm" className="shrink-0" onClick={() => ask("छत्रपती शिवाजी महाराज महाराजस्व अभियान म्हणजे काय आणि त्यात कोणत्या सेवा मिळतात?")}>
              {M ? "अधिक विचारा" : "Ask more"}
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Why — citizen benefits */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <Reveal className="mb-9 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{M ? "फायदे" : "Why"}</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{M ? "महसूल संकेत का वापरावा?" : "Why Mahasul Sanket?"}</h2>
        </Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07} amount={0.15}>
          {BENEFITS.map((b) => (
            <StaggerItem key={b.ten}>
              <div className="group h-full rounded-3xl border border-border bg-surface/70 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                  <b.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold">{M ? b.tmr : b.ten}</h3>
                <p className="mt-1.5 text-sm text-muted">{M ? b.dmr : b.den}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Officer strip (separate, compact) */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-border bg-surface-2/50 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LayoutDashboard className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold">{M ? "शासकीय अधिकारी आहात?" : "Are you a government officer?"}</p>
                <p className="text-sm text-muted">
                  {M ? "तलाठी ते जिल्हा प्रशासन — डॅशबोर्ड, तिकीट प्रणाली व राज्यस्तरीय विश्लेषण." : "Talathi to District admin — dashboards, ticketing & state-wide analytics."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/login"><Button size="sm"><LogIn className="h-4 w-4" aria-hidden />{M ? "प्रवेश" : "Sign in"}</Button></Link>
              <Link href="/register"><Button size="sm" variant="outline">{M ? "नोंदणी" : "Register"}</Button></Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted">
              {M
                ? "महाराष्ट्र शासन, महसूल विभागाचा AI ज्ञान सहाय्यक — शासन निर्णय व परिपत्रकांवर आधारित अचूक, अधिकृत मार्गदर्शन."
                : "The Maharashtra Revenue Department's AI knowledge assistant — accurate guidance grounded in official GRs & circulars."}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
              <a href="https://bhulekh.mahabhumi.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground">{M ? "महाभूलेख ७/१२" : "Mahabhulekh 7/12"}</a>
              <a href="https://aaplesarkar.mahaonline.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground">{M ? "आपले सरकार" : "Aaple Sarkar"}</a>
              <a href="https://igrmaharashtra.gov.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground">IGR</a>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">{M ? "अधिकारी प्रवेश" : "Officer Login"}</Link>
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
