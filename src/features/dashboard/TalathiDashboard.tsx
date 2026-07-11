"use client";

// Talathi (L1) dashboard — personal workspace.
// Reference style: KPI stat cards with trend chips, quick actions,
// recent activity lists, encouragement strip. Framer Motion entrances.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquareText, Ticket as TicketIcon, BookOpen, CheckCircle2,
  ArrowRight, Mic, Plus, Clock, Sparkles,
} from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useGreeting } from "@/lib/utils/useGreeting";
import { formatDate } from "@/lib/utils/datetime";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";

/* ── animated number ── */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current;
    const duration = 800;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString("en-IN")}</>;
}

/* ── motion presets ── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export interface TalathiDashboardData {
  fullName: string;
  openTickets: number;
  resolvedTickets: number;
  conversations: number;
  documents: number;
  recentTickets: {
    id: string;
    ticket_number: string;
    subject: string;
    status: string;
    current_level: string;
    sla_due_at: string | null;
  }[];
  recentConversations: { id: string; title: string; updated_at: string }[];
}

export function TalathiDashboard({ data }: { data: TalathiDashboardData }) {
  const { lang } = useLang();
  const { greeting, today } = useGreeting(lang);

  const kpis = [
    {
      icon: TicketIcon,
      label: lang === "mr" ? "प्रलंबित तिकिटे" : "Open tickets",
      value: data.openTickets,
      href: "/tickets",
      tone: "bg-accent/12 text-accent",
    },
    {
      icon: CheckCircle2,
      label: lang === "mr" ? "निराकरण झालेली" : "Resolved",
      value: data.resolvedTickets,
      href: "/tickets",
      tone: "bg-primary/12 text-primary",
    },
    {
      icon: MessageSquareText,
      label: lang === "mr" ? "AI संभाषणे" : "AI conversations",
      value: data.conversations,
      href: "/chat",
      tone: "bg-secondary/15 text-secondary",
    },
    {
      icon: BookOpen,
      label: lang === "mr" ? "ज्ञान दस्तऐवज" : "Knowledge documents",
      value: data.documents,
      href: "/knowledge",
      tone: "bg-primary/12 text-primary",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Greeting hero */}
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted" suppressHydrationWarning>{today}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {greeting}, {data.fullName.split(" ")[0]} 🙏
          </h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "mr"
              ? "तुमचा AI ज्ञान सहाय्यक तयार आहे."
              : "Your AI knowledge assistant is ready."}
          </p>
        </div>
        <Link
          href="/chat"
          className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-fg shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
        >
          <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" aria-hidden />
          {lang === "mr" ? "AI ला विचारा" : "Ask AI"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </motion.div>

      {/* KPI row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", k.tone)}>
                  <k.icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-3xl font-bold tabular-nums">
                  <CountUp value={k.value} />
                </p>
                <p className="mt-1 text-sm text-muted">{k.label}</p>
              </Card>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/chat", icon: Mic, mr: "आवाजाने प्रश्न विचारा", en: "Ask by voice" },
          { href: "/tickets/new", icon: Plus, mr: "नवीन तिकीट", en: "New ticket" },
          { href: "/knowledge", icon: BookOpen, mr: "GR / परिपत्रक शोधा", en: "Search GRs" },
        ].map((a) => (
          <Link
            key={a.href + a.en}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-fg">
              <a.icon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="text-sm font-medium">{lang === "mr" ? a.mr : a.en}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
          </Link>
        ))}
      </motion.div>

      {/* Activity: recent tickets + recent conversations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">
                {lang === "mr" ? "अलीकडील तिकिटे" : "Recent tickets"}
              </h2>
              <Link href="/tickets" className="text-sm font-medium text-primary hover:underline">
                {lang === "mr" ? "सर्व पहा" : "View all"}
              </Link>
            </div>
            {!data.recentTickets.length && (
              <p className="py-8 text-center text-sm text-muted">
                {lang === "mr" ? "अद्याप तिकिटे नाहीत — AI बहुधा सर्व उत्तरे देत आहे! 🎉" : "No tickets yet — the AI is answering everything! 🎉"}
              </p>
            )}
            <ul className="space-y-2">
              {data.recentTickets.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tickets/${t.id}`}
                    className="block rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-surface-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted">{t.ticket_number}</span>
                      <TicketStatusBadge status={t.status} />
                      <Badge tone="primary">{t.current_level}</Badge>
                      {t.sla_due_at && (
                        <Badge tone={new Date(t.sla_due_at) < new Date() ? "danger" : "warning"}>
                          <Clock className="mr-1 inline h-3 w-3" aria-hidden />
                          {formatDate(t.sla_due_at, lang)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{t.subject}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">
                {lang === "mr" ? "अलीकडील संभाषणे" : "Recent conversations"}
              </h2>
              <Link href="/chat" className="text-sm font-medium text-primary hover:underline">
                {lang === "mr" ? "नवीन" : "New"}
              </Link>
            </div>
            {!data.recentConversations.length && (
              <p className="py-8 text-center text-sm text-muted">
                {lang === "mr" ? "पहिला प्रश्न विचारून सुरुवात करा." : "Ask your first question to get started."}
              </p>
            )}
            <ul className="space-y-1">
              {data.recentConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href="/chat"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface-2"
                  >
                    <MessageSquareText className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {formatDate(c.updated_at, lang)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Encouragement strip */}
      <motion.div variants={item}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-primary to-secondary p-5 text-primary-fg">
          <span className="text-2xl" aria-hidden>🌾</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {lang === "mr" ? "उत्तम काम!" : "Great work!"}
            </p>
            <p className="text-sm opacity-90">
              {lang === "mr"
                ? "तुमच्या प्रत्येक प्रश्नाने प्रणाली अधिक हुशार होते — आणि महाराष्ट्रातील प्रत्येक तलाठ्याला मदत होते."
                : "Every question you ask makes the system smarter — and helps every Talathi in Maharashtra."}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
