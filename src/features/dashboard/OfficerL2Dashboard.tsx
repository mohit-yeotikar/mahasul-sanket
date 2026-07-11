"use client";

// Nayab Tahsildar (L2) dashboard — the first officer work queue.
// Focus: what needs my action now, SLA promises I must keep.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Inbox, Timer, CheckCircle2, TriangleAlert, ArrowRight, BookPlus,
} from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import { useGreeting } from "@/lib/utils/useGreeting";
import { LivePulse } from "./LivePulse";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export interface QueueTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  current_level: string;
  sla_due_at: string | null;
  created_at: string;
}

export interface OfficerL2Data {
  fullName: string;
  pendingQueue: number;
  inProgress: number;
  overdue: number;
  resolvedTotal: number;
  queue: QueueTicket[];
}

function slaBadge(due: string | null, lang: "mr" | "en") {
  if (!due) return null;
  const days = Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000);
  if (days < 0)
    return <Badge tone="danger">⏱ {lang === "mr" ? `${-days} दिवस उशीर` : `${-days}d overdue`}</Badge>;
  if (days === 0)
    return <Badge tone="danger">⏱ {lang === "mr" ? "आज अंतिम" : "Due today"}</Badge>;
  if (days <= 2)
    return <Badge tone="warning">⏱ {lang === "mr" ? `${days} दिवस उरले` : `${days}d left`}</Badge>;
  return <Badge tone="neutral">⏱ {lang === "mr" ? `${days} दिवस` : `${days}d`}</Badge>;
}

export function OfficerL2Dashboard({ data }: { data: OfficerL2Data }) {
  const { lang } = useLang();
  const { greeting, today } = useGreeting(lang);

  const kpis = [
    {
      icon: Inbox,
      label: lang === "mr" ? "माझ्या रांगेत (L2)" : "In my queue (L2)",
      value: data.pendingQueue,
      tone: "bg-accent/12 text-accent",
      urgent: data.pendingQueue > 0,
    },
    {
      icon: Timer,
      label: lang === "mr" ? "मुदत उलटलेली" : "Overdue SLA",
      value: data.overdue,
      tone: "bg-danger/10 text-danger",
      urgent: data.overdue > 0,
    },
    {
      icon: TriangleAlert,
      label: lang === "mr" ? "प्रगतीत" : "In progress",
      value: data.inProgress,
      tone: "bg-primary/12 text-primary",
    },
    {
      icon: CheckCircle2,
      label: lang === "mr" ? "एकूण निराकरण" : "Total resolved",
      value: data.resolvedTotal,
      tone: "bg-secondary/15 text-secondary",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      <motion.div variants={item}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted" suppressHydrationWarning>{today}</p>
          <LivePulse />
        </div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {greeting}, {data.fullName.split(" ")[0]} 🙏
        </h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "mr"
            ? "नायब तहसीलदार कार्यपटल — तुमच्या तालुक्यातील तिकिटे तुमची वाट पाहत आहेत."
            : "Nayab Tahsildar workspace — tickets in your taluka await your action."}
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href="/dco">
            <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <Card className={cn("p-5 transition-shadow hover:shadow-md", k.urgent && "ring-1 ring-accent/40")}>
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", k.tone)}>
                  <k.icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-3xl font-bold tabular-nums">{k.value.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-sm text-muted">{k.label}</p>
              </Card>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Action queue */}
      <motion.div variants={item}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {lang === "mr" ? "कृती आवश्यक — तिकीट रांग" : "Action needed — ticket queue"}
            </h2>
            <Link href="/dco" className="text-sm font-medium text-primary hover:underline">
              {lang === "mr" ? "सर्व पहा" : "View all"}
            </Link>
          </div>

          {!data.queue.length && (
            <p className="py-10 text-center text-sm text-muted">
              {lang === "mr" ? "रांग रिकामी आहे — उत्तम काम! 🎉" : "Queue is empty — great work! 🎉"}
            </p>
          )}

          <ul className="divide-y divide-border">
            {data.queue.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={`/tickets/${tk.id}`}
                  className="group flex items-center gap-3 py-3 transition-colors hover:bg-surface-2 rounded-lg px-2 -mx-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted">{tk.ticket_number}</span>
                      <TicketStatusBadge status={tk.status} />
                      <Badge tone={tk.priority === "critical" || tk.priority === "high" ? "danger" : "neutral"}>
                        {tk.priority}
                      </Badge>
                      <Badge>{CATEGORY_LABELS[tk.category]?.[lang] ?? tk.category}</Badge>
                      {slaBadge(tk.sla_due_at, lang)}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{tk.subject}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      {/* Tip strip */}
      <motion.div variants={item}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-primary to-secondary p-5 text-primary-fg">
          <BookPlus className="h-6 w-6 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm">
            {lang === "mr"
              ? "सर्वांना लागू होणारे उत्तर दिल्यावर ते 'ज्ञान भांडारात प्रस्तावित करा' — मंजुरीनंतर AI पुढच्या वेळी स्वतः उत्तर देईल आणि तुमची रांग कमी होईल."
              : "When you answer something generic, use 'Propose as knowledge' — after approval the AI answers it next time, shrinking your queue."}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
