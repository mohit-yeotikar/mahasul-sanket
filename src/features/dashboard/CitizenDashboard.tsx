"use client";

// Citizen dashboard — the limited, public-facing home screen.
// Three things a citizen needs: ask the AI for information, see what's new,
// and reach the right officer for their area.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Phone, FileText, LayoutGrid, MessageSquareText,
  MapPin, ScrollText,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useGreeting } from "@/lib/utils/useGreeting";
import { formatDate } from "@/lib/utils/datetime";
import { ROLE_LABELS } from "@/lib/i18n/dictionaries";

export interface CitizenOfficer {
  full_name: string;
  role: string;
  mobile: string;
  taluka_name_mr: string | null;
  taluka_name_en: string | null;
}
export interface CitizenInfoItem {
  id: string;
  title: string;
  title_mr: string | null;
  summary: string | null;
  doc_type: string;
  gr_number: string | null;
  issued_date: string | null;
  created_at: string;
}
export interface CitizenDashboardData {
  fullName: string;
  districtNameMr: string | null;
  districtNameEn: string | null;
  officers: CitizenOfficer[];
  newInfo: CitizenInfoItem[];
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export function CitizenDashboard({ data }: { data: CitizenDashboardData }) {
  const { lang } = useLang();
  const { greeting, today } = useGreeting(lang);
  const districtName = lang === "mr" ? data.districtNameMr : data.districtNameEn;

  const quick = [
    { href: "/chat", icon: MessageSquareText, mr: "माहिती विचारा", en: "Ask for information" },
    { href: "/officers", icon: Phone, mr: "क्षेत्रातील अधिकारी", en: "Area officers" },
    { href: "/seva", icon: LayoutGrid, mr: "शासकीय सेवा", en: "Government services" },
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
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            {districtName && (
              <>
                <MapPin className="h-4 w-4" aria-hidden />
                {districtName}
                {lang === "mr" ? " जिल्हा" : " district"}
                {" · "}
              </>
            )}
            {lang === "mr"
              ? "महसूल व भूमी सेवांची माहिती इथे मिळेल."
              : "Find revenue & land services information here."}
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

      {/* Quick actions */}
      <motion.div variants={item} className="grid gap-3 sm:grid-cols-3">
        {quick.map((a) => (
          <Link
            key={a.href}
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* New information feed */}
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-secondary" aria-hidden />
              <h2 className="font-semibold">
                {lang === "mr" ? "नवीन माहिती" : "What's new"}
              </h2>
            </div>
            {!data.newInfo.length && (
              <p className="py-8 text-center text-sm text-muted">
                {lang === "mr" ? "अद्याप नवीन माहिती नाही." : "No new information yet."}
              </p>
            )}
            <ul className="space-y-2">
              {data.newInfo.map((d) => (
                <li key={d.id} className="rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-surface-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {d.doc_type}
                    </span>
                    {d.gr_number && <Badge tone="primary">{d.gr_number}</Badge>}
                    {(d.issued_date || d.created_at) && (
                      <span className="ml-auto text-xs text-muted">
                        {formatDate(d.issued_date ?? d.created_at, lang)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {lang === "mr" ? d.title_mr || d.title : d.title}
                  </p>
                  {d.summary && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{d.summary}</p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Area officers */}
        <motion.div variants={item}>
          <Card className="h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-accent" aria-hidden />
                <h2 className="font-semibold">
                  {lang === "mr" ? "तुमच्या क्षेत्रातील अधिकारी" : "Your area officers"}
                </h2>
              </div>
              <Link href="/officers" className="text-sm font-medium text-primary hover:underline">
                {lang === "mr" ? "सर्व पहा" : "View all"}
              </Link>
            </div>
            {!data.officers.length && (
              <p className="py-8 text-center text-sm text-muted">
                {lang === "mr"
                  ? "तुमच्या क्षेत्रातील अधिकाऱ्यांची माहिती लवकरच उपलब्ध होईल."
                  : "Officer details for your area will be available soon."}
              </p>
            )}
            <ul className="space-y-2">
              {data.officers.slice(0, 5).map((o, i) => (
                <li
                  key={`${o.mobile}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.full_name}</p>
                    <p className="text-xs text-muted">
                      {ROLE_LABELS[o.role]?.[lang] ?? o.role}
                      {(o.taluka_name_mr || o.taluka_name_en) &&
                        ` · ${lang === "mr" ? o.taluka_name_mr : o.taluka_name_en}`}
                    </p>
                  </div>
                  <a
                    href={`tel:${o.mobile}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-fg"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    {o.mobile}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Disclaimer */}
      <motion.div variants={item}>
        <p className="rounded-xl bg-surface-2 p-4 text-center text-xs text-muted">
          {lang === "mr"
            ? "टीप: येथील AI उत्तरे मार्गदर्शनासाठी आहेत. अधिकृत कार्यवाहीसाठी संबंधित तलाठी/तहसील कार्यालयाशी संपर्क साधा."
            : "Note: AI answers here are for guidance. For official action, contact the concerned Talathi / Tahsil office."}
        </p>
      </motion.div>
    </motion.div>
  );
}
