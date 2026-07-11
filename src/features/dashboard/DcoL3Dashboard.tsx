"use client";

// DCO (L3) dashboard — district command center.
// Focus: verify new Talathis, handle escalations that reached L3,
// watch the whole district's ticket health.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserCheck, ArrowUpCircle, Timer, Ticket as TicketIcon,
  ArrowRight, BookPlus, BarChart3,
} from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import type { QueueTicket } from "./OfficerL2Dashboard";
import { LivePulse } from "./LivePulse";
import { useGreeting } from "@/lib/utils/useGreeting";
import { formatDate } from "@/lib/utils/datetime";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export interface DcoL3Data {
  fullName: string;
  districtNameMr: string | null;
  pendingVerifications: number;
  escalatedToMe: number;
  activeDistrict: number;
  overdue: number;
  escalatedQueue: QueueTicket[];
  pendingUsers: { id: string; full_name: string; mobile: string; created_at: string }[];
  categoryCounts: { category: string; count: number }[];
}

export function DcoL3Dashboard({ data }: { data: DcoL3Data }) {
  const { lang } = useLang();
  const { greeting, today } = useGreeting(lang);

  const maxCat = Math.max(1, ...data.categoryCounts.map((c) => c.count));

  const kpis = [
    {
      icon: UserCheck,
      label: lang === "mr" ? "पडताळणी प्रलंबित" : "Pending verifications",
      value: data.pendingVerifications,
      tone: "bg-accent/12 text-accent",
      urgent: data.pendingVerifications > 0,
      href: "/dco",
    },
    {
      icon: ArrowUpCircle,
      label: lang === "mr" ? "माझ्याकडे वर्ग (L3)" : "Escalated to me (L3)",
      value: data.escalatedToMe,
      tone: "bg-danger/10 text-danger",
      urgent: data.escalatedToMe > 0,
      href: "/dco",
    },
    {
      icon: TicketIcon,
      label: lang === "mr" ? "जिल्ह्यात सक्रिय" : "Active in district",
      value: data.activeDistrict,
      tone: "bg-primary/12 text-primary",
      href: "/dco",
    },
    {
      icon: Timer,
      label: lang === "mr" ? "मुदत उलटलेली" : "Overdue SLA",
      value: data.overdue,
      tone: "bg-warning/10 text-warning",
      urgent: data.overdue > 0,
      href: "/dco",
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
            ? `जिल्हा नियंत्रण कक्ष${data.districtNameMr ? ` — ${data.districtNameMr} जिल्हा` : ""}`
            : `District command center${data.districtNameMr ? ` — ${data.districtNameMr}` : ""}`}
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Verification queue */}
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">
                {lang === "mr" ? "खाते पडताळणी रांग" : "Verification queue"}
              </h2>
              <Link href="/dco" className="text-sm font-medium text-primary hover:underline">
                {lang === "mr" ? "पडताळणी करा" : "Verify"}
              </Link>
            </div>
            {!data.pendingUsers.length && (
              <p className="py-8 text-center text-sm text-muted">
                {lang === "mr" ? "सर्व खाती पडताळलेली आहेत ✅" : "All accounts verified ✅"}
              </p>
            )}
            <ul className="space-y-2">
              {data.pendingUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent">
                    {u.full_name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted">📱 {u.mobile}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted">
                    {formatDate(u.created_at, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Category breakdown — ranked bars */}
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted" aria-hidden />
              <h2 className="font-semibold">
                {lang === "mr" ? "सक्रिय तिकिटे — विषयानुसार" : "Active tickets by category"}
              </h2>
            </div>
            {!data.categoryCounts.length && (
              <p className="py-8 text-center text-sm text-muted">—</p>
            )}
            <ul className="space-y-3">
              {data.categoryCounts.map((c, i) => (
                <li key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{CATEGORY_LABELS[c.category]?.[lang] ?? c.category}</span>
                    <span className="font-semibold tabular-nums">{c.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.count / maxCat) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                      className={cn("h-full rounded-full", i === 0 ? "bg-primary" : "bg-secondary/70")}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Escalated queue */}
      <motion.div variants={item}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {lang === "mr" ? "L3 वर वर्ग झालेली तिकिटे — तुमची कृती आवश्यक" : "Escalated to L3 — your action needed"}
            </h2>
            <Link href="/dco" className="text-sm font-medium text-primary hover:underline">
              {lang === "mr" ? "सर्व पहा" : "View all"}
            </Link>
          </div>
          {!data.escalatedQueue.length && (
            <p className="py-8 text-center text-sm text-muted">
              {lang === "mr" ? "L3 वर कोणतीही तिकिटे नाहीत 🎉" : "Nothing escalated to L3 🎉"}
            </p>
          )}
          <ul className="divide-y divide-border">
            {data.escalatedQueue.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={`/tickets/${tk.id}`}
                  className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted">{tk.ticket_number}</span>
                      <TicketStatusBadge status={tk.status} />
                      <Badge tone={tk.priority === "critical" || tk.priority === "high" ? "danger" : "neutral"}>
                        {tk.priority}
                      </Badge>
                      <Badge>{CATEGORY_LABELS[tk.category]?.[lang] ?? tk.category}</Badge>
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

      <motion.div variants={item}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-primary to-secondary p-5 text-primary-fg">
          <BookPlus className="h-6 w-6 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm">
            {lang === "mr"
              ? "जिल्ह्यात वारंवार येणारे प्रश्न 'ज्ञान भांडारात प्रस्तावित करा' — मंजुरीनंतर AI ती उत्तरे स्वतः देईल आणि जिल्ह्याची तिकीट संख्या घटेल."
              : "Propose your district's recurring questions as knowledge — after approval the AI answers them itself and district ticket volume drops."}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
