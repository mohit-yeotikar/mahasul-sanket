"use client";

// State/Super Admin (L5) — the king's war room.
// Live Maharashtra map with actionable insights: where is the fire,
// who is slow, what needs my signature.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Landmark, Users, BookOpen, MessageSquareText, ThumbsUp, UserCheck,
  CheckCircle2, ArrowRight, BarChart3, Bot, Flame, TriangleAlert, Map as MapIcon,
} from "lucide-react";
import { Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { MaharashtraMap, type DistrictMetric } from "./MaharashtraMap";
import { LivePulse } from "./LivePulse";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export interface StateL5Data {
  fullName: string;
  activeUsers: number;
  totalTickets: number;
  resolutionRate: number | null;
  aiConversations: number;
  aiHelpfulRate: number | null;
  knowledgeDocs: number;
  pendingApprovals: number;
  pendingVerifications: number;
  districtMetrics: DistrictMetric[];
}

function Ring({ percent, label, href }: { percent: number | null; label: string; href: string }) {
  const p = percent ?? 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <Link href={href} className="group flex flex-col items-center">
      <div className="relative h-24 w-24 transition-transform group-hover:scale-105">
        <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
          <circle cx="42" cy="42" r={r} fill="none" strokeWidth="8" className="stroke-[var(--surface-2)]" />
          <motion.circle
            cx="42" cy="42" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
            className="stroke-[var(--primary)]"
            initial={{ strokeDasharray: c, strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (c * p) / 100 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
          {percent === null ? "—" : `${Math.round(p)}%`}
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-muted group-hover:text-primary">{label}</p>
    </Link>
  );
}

export function StateL5Dashboard({ data }: { data: StateL5Data }) {
  const { lang } = useLang();

  const metricsByCode = Object.fromEntries(data.districtMetrics.map((m) => [m.code, m]));
  const worstOverdue = [...data.districtMetrics].sort((a, b) => b.overdue - a.overdue)[0];
  const worstLoad = [...data.districtMetrics].sort((a, b) => b.active - a.active)[0];
  const totalOverdue = data.districtMetrics.reduce((s, m) => s + m.overdue, 0);
  const totalActive = data.districtMetrics.reduce((s, m) => s + m.active, 0);

  const kpis = [
    { icon: Users, label: lang === "mr" ? "सक्रिय वापरकर्ते" : "Active users", value: data.activeUsers, tone: "bg-primary/12 text-primary", href: "/admin" },
    { icon: MessageSquareText, label: lang === "mr" ? "AI संभाषणे" : "AI conversations", value: data.aiConversations, tone: "bg-secondary/15 text-secondary", href: "/reports" },
    { icon: BookOpen, label: lang === "mr" ? "ज्ञान दस्तऐवज" : "Knowledge documents", value: data.knowledgeDocs, tone: "bg-primary/12 text-primary", href: "/knowledge" },
    { icon: CheckCircle2, label: lang === "mr" ? "मंजुरी प्रलंबित" : "Approvals pending", value: data.pendingApprovals, tone: "bg-accent/12 text-accent", urgent: data.pendingApprovals > 0, href: "/admin" },
  ];

  // Actionable insights, worst first — each one is a decision the king can take now.
  const insights: { icon: typeof Flame; tone: string; text: string; href: string; cta: string }[] = [];
  if (worstOverdue && worstOverdue.overdue > 0) {
    insights.push({
      icon: Flame, tone: "text-danger bg-danger/10",
      text: lang === "mr"
        ? `${worstOverdue.nameMr} जिल्ह्यात ${worstOverdue.overdue} तिकिटांची मुदत उलटली आहे — सर्वाधिक राज्यात.`
        : `${worstOverdue.nameMr}: ${worstOverdue.overdue} tickets past their promised deadline — worst in the state.`,
      href: `/reports?district=${worstOverdue.code}`,
      cta: lang === "mr" ? "जिल्हा पहा" : "Inspect district",
    });
  }
  if (worstLoad && worstLoad.active > 0) {
    insights.push({
      icon: BarChart3, tone: "text-accent bg-accent/10",
      text: lang === "mr"
        ? `सर्वाधिक सक्रिय भार: ${worstLoad.nameMr} (${worstLoad.active} तिकिटे) — एकूण राज्यात ${totalActive}.`
        : `Heaviest load: ${worstLoad.nameMr} (${worstLoad.active} tickets) of ${totalActive} statewide.`,
      href: `/reports?district=${worstLoad.code}`,
      cta: lang === "mr" ? "तपशील" : "Details",
    });
  }
  if (data.pendingVerifications > 0) {
    insights.push({
      icon: UserCheck, tone: "text-warning bg-warning/10",
      text: lang === "mr"
        ? `राज्यभरात ${data.pendingVerifications} तलाठी खाती पडताळणीच्या प्रतीक्षेत आहेत.`
        : `${data.pendingVerifications} Talathi accounts await verification statewide.`,
      href: "/dco",
      cta: lang === "mr" ? "रांग पहा" : "View queue",
    });
  }
  if (data.pendingApprovals > 0) {
    insights.push({
      icon: BookOpen, tone: "text-primary bg-primary/10",
      text: lang === "mr"
        ? `${data.pendingApprovals} ज्ञान/दस्तऐवज मंजुऱ्या प्रलंबित — प्रत्येक मंजुरीने AI हुशार होते.`
        : `${data.pendingApprovals} knowledge/document approvals pending — each one makes the AI smarter.`,
      href: "/admin",
      cta: lang === "mr" ? "मंजूर करा" : "Approve now",
    });
  }
  if (!insights.length) {
    insights.push({
      icon: CheckCircle2, tone: "text-success bg-success/10",
      text: lang === "mr" ? "सर्व काही नियंत्रणात आहे — कोणतीही तातडीची बाब नाही. 🎉" : "All clear — nothing urgent anywhere. 🎉",
      href: "/reports",
      cta: lang === "mr" ? "अहवाल" : "Reports",
    });
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-fg">
          <Landmark className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {lang === "mr" ? "राज्य नियंत्रण कक्ष" : "State Command Center"}
          </h1>
          <p className="text-sm text-muted">
            {lang === "mr"
              ? `नमस्कार, ${data.fullName.split(" ")[0]} — संपूर्ण महाराष्ट्र एका दृष्टीत`
              : `Welcome, ${data.fullName.split(" ")[0]} — all of Maharashtra at a glance`}
          </p>
        </div>
        <LivePulse />
      </motion.div>

      {/* KPI row — every card opens its data */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <Card className={cn("group p-5 transition-shadow hover:shadow-md", k.urgent && "ring-1 ring-accent/40")}>
                <div className="flex items-start justify-between">
                  <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", k.tone)}>
                    <k.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </div>
                <p className="text-3xl font-bold tabular-nums">{k.value.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-sm text-muted">{k.label}</p>
              </Card>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Map + insights */}
      <div className="grid gap-4 lg:grid-cols-5">
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-muted" aria-hidden />
                <h2 className="font-semibold">
                  {lang === "mr" ? "महाराष्ट्र — जिल्हानिहाय स्थिती" : "Maharashtra — district status"}
                </h2>
              </div>
              {totalOverdue > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
                  {totalOverdue} {lang === "mr" ? "मुदत उलटलेली" : "overdue"}
                </span>
              )}
            </div>
            <MaharashtraMap metrics={metricsByCode} />
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="flex h-full flex-col p-5">
            <h2 className="mb-4 font-semibold">
              {lang === "mr" ? "⚡ कृतीयोग्य निष्कर्ष" : "⚡ Actionable insights"}
            </h2>
            <div className="flex-1 space-y-3">
              {insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex gap-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", ins.tone)}>
                      <ins.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">{ins.text}</p>
                      <Link href={ins.href} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        {ins.cta} <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* AI health rings */}
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted" aria-hidden />
                <p className="text-sm font-semibold">{lang === "mr" ? "AI आरोग्य" : "AI health"}</p>
              </div>
              <div className="flex items-center justify-around">
                <Ring
                  percent={data.resolutionRate}
                  label={lang === "mr" ? "निराकरण दर" : "Resolution rate"}
                  href="/reports"
                />
                <Ring
                  percent={data.aiHelpfulRate}
                  label={lang === "mr" ? "AI उपयुक्तता 👍" : "AI helpfulness 👍"}
                  href="/reports"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* District leaderboard */}
      <motion.div variants={item}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted" aria-hidden />
              <h2 className="font-semibold">
                {lang === "mr" ? "जिल्हा क्रमवारी — सक्रिय तिकिटे" : "District ranking — active tickets"}
              </h2>
            </div>
            <Link href="/reports" className="text-sm font-medium text-primary hover:underline">
              {lang === "mr" ? "सविस्तर अहवाल" : "Full reports"}
            </Link>
          </div>
          {!data.districtMetrics.some((m) => m.active > 0) && (
            <p className="py-8 text-center text-sm text-muted">
              {lang === "mr" ? "कोणतीही सक्रिय तिकिटे नाहीत 🎉" : "No active tickets anywhere 🎉"}
            </p>
          )}
          <ul className="space-y-3">
            {[...data.districtMetrics]
              .filter((m) => m.active > 0)
              .sort((a, b) => b.active - a.active)
              .slice(0, 10)
              .map((d, i, arr) => (
                <li key={d.code}>
                  <Link href={`/reports?district=${d.code}`} className="group block">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-5 text-right font-semibold text-muted">{i + 1}</span>
                        <span className="group-hover:text-primary">{d.nameMr}</span>
                        {d.overdue > 0 && (
                          <span className="rounded-full bg-danger/10 px-2 text-xs font-semibold text-danger">
                            {d.overdue} {lang === "mr" ? "उशीर" : "late"}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums">{d.active}</span>
                    </div>
                    <div className="ml-7 h-2 overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.active / Math.max(1, arr[0].active)) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.05, ease: "easeOut" }}
                        className={cn("h-full rounded-full", i === 0 ? "bg-accent" : "bg-primary/70")}
                      />
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </Card>
      </motion.div>
    </motion.div>
  );
}
