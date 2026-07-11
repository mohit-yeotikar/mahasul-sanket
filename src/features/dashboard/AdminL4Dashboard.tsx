"use client";

// District Admin (L4) dashboard — governance center.
// Focus: approvals that gate the AI's learning, final-level escalations,
// and the health of the district's team.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookCheck, FileCheck2, ArrowUpCircle, Users, ArrowRight,
  ScrollText, ShieldCheck,
} from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS, ROLE_LABELS } from "@/lib/i18n/dictionaries";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import type { QueueTicket } from "./OfficerL2Dashboard";
import { LivePulse } from "./LivePulse";
import { useGreeting } from "@/lib/utils/useGreeting";
import { formatDate, formatDateTime } from "@/lib/utils/datetime";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export interface AdminL4Data {
  fullName: string;
  districtNameMr: string | null;
  pendingProposals: number;
  pendingDocuments: number;
  escalatedL4: number;
  activeUsers: number;
  escalatedQueue: QueueTicket[];
  roleCounts: { role: string; count: number }[];
  recentAudit: { id: number; action: string; created_at: string; actor_name: string | null }[];
  proposals: { id: string; question: string; created_at: string }[];
}

export function AdminL4Dashboard({ data }: { data: AdminL4Data }) {
  const { lang } = useLang();
  const { greeting, today } = useGreeting(lang);

  const maxRole = Math.max(1, ...data.roleCounts.map((r) => r.count));

  const kpis = [
    {
      icon: BookCheck,
      label: lang === "mr" ? "ज्ञान प्रस्ताव प्रलंबित" : "Knowledge proposals",
      value: data.pendingProposals,
      tone: "bg-accent/12 text-accent",
      urgent: data.pendingProposals > 0,
      href: "/admin",
    },
    {
      icon: FileCheck2,
      label: lang === "mr" ? "दस्तऐवज मंजुरी" : "Document approvals",
      value: data.pendingDocuments,
      tone: "bg-warning/10 text-warning",
      urgent: data.pendingDocuments > 0,
      href: "/admin",
    },
    {
      icon: ArrowUpCircle,
      label: lang === "mr" ? "अंतिम स्तर (L4) तिकिटे" : "Final-level (L4) tickets",
      value: data.escalatedL4,
      tone: "bg-danger/10 text-danger",
      urgent: data.escalatedL4 > 0,
      href: "/dco",
    },
    {
      icon: Users,
      label: lang === "mr" ? "सक्रिय वापरकर्ते" : "Active users",
      value: data.activeUsers,
      tone: "bg-primary/12 text-primary",
      href: "/admin",
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
            ? `जिल्हा प्रशासन कक्ष${data.districtNameMr ? ` — ${data.districtNameMr} जिल्हा` : ""} · तुमच्या मंजुरीने AI शिकते`
            : `District governance${data.districtNameMr ? ` — ${data.districtNameMr}` : ""} · your approvals teach the AI`}
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
        {/* Approval inbox */}
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">
                {lang === "mr" ? "मंजुरीची प्रतीक्षा — ज्ञान प्रस्ताव" : "Awaiting your approval — knowledge"}
              </h2>
              <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
                {lang === "mr" ? "मंजूर करा" : "Review"}
              </Link>
            </div>
            {!data.proposals.length && (
              <p className="py-8 text-center text-sm text-muted">
                {lang === "mr" ? "कोणतेही प्रस्ताव प्रलंबित नाहीत ✅" : "No proposals pending ✅"}
              </p>
            )}
            <ul className="space-y-2">
              {data.proposals.map((p) => (
                <li key={p.id}>
                  <Link href="/admin" className="block rounded-lg bg-surface-2 p-3 transition-colors hover:bg-accent-soft">
                    <p className="line-clamp-2 text-sm font-medium">❓ {p.question}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(p.created_at, lang)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Team composition */}
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted" aria-hidden />
              <h2 className="font-semibold">
                {lang === "mr" ? "जिल्हा पथक — भूमिकेनुसार" : "District team by role"}
              </h2>
            </div>
            {!data.roleCounts.length && <p className="py-8 text-center text-sm text-muted">—</p>}
            <ul className="space-y-3">
              {data.roleCounts.map((r, i) => (
                <li key={r.role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{ROLE_LABELS[r.role]?.[lang] ?? r.role}</span>
                    <span className="font-semibold tabular-nums">{r.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.count / maxRole) * 100}%` }}
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

      {/* L4 escalations */}
      <motion.div variants={item}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {lang === "mr" ? "अंतिम स्तरावर (L4) — तुमचा निर्णय अंतिम" : "At final level (L4) — your decision is final"}
            </h2>
            <Link href="/dco" className="text-sm font-medium text-primary hover:underline">
              {lang === "mr" ? "सर्व पहा" : "View all"}
            </Link>
          </div>
          {!data.escalatedQueue.length && (
            <p className="py-8 text-center text-sm text-muted">
              {lang === "mr" ? "L4 वर कोणतीही तिकिटे नाहीत 🎉" : "Nothing at L4 🎉"}
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

      {/* Recent governance activity */}
      <motion.div variants={item}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-muted" aria-hidden />
              <h2 className="font-semibold">
                {lang === "mr" ? "अलीकडील प्रशासकीय नोंदी" : "Recent governance activity"}
              </h2>
            </div>
            <Link href="/audit" className="text-sm font-medium text-primary hover:underline">
              {lang === "mr" ? "सर्व नोंदी" : "Full log"}
            </Link>
          </div>
          {!data.recentAudit.length && <p className="py-6 text-center text-sm text-muted">—</p>}
          <ul className="space-y-2">
            {data.recentAudit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted">
                  {formatDateTime(a.created_at, lang)}
                </span>
                <span className="font-medium">{a.actor_name ?? "system"}</span>
                <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">{a.action}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>
    </motion.div>
  );
}
