"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge, Card, Select } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/utils/datetime";
import { TicketStatusBadge } from "./TicketStatusBadge";

export interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  category: string | null;
  priority: string;
  status: string;
  current_level: string;
  sla_due_at: string | null;
}

export function TicketsList({ tickets }: { tickets: TicketRow[] }) {
  const { lang } = useLang();
  const [cat, setCat] = useState<string>("");

  // Only offer filters for services that actually appear, with live counts.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tickets) {
      const c = t.category ?? "others";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [tickets]);

  const chips = useMemo(
    () =>
      [...counts.keys()].sort(
        (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0)
      ),
    [counts]
  );

  const filtered = cat ? tickets.filter((t) => (t.category ?? "others") === cat) : tickets;

  return (
    <div className="space-y-4">
      {/* Service (category) filter — dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="ticket-service" className="text-sm text-muted">
          {lang === "mr" ? "सेवा:" : "Service:"}
        </label>
        <Select
          id="ticket-service"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="w-full sm:w-72"
          aria-label={lang === "mr" ? "सेवेनुसार गाळा" : "Filter by service"}
        >
          <option value="">{lang === "mr" ? `सर्व सेवा (${tickets.length})` : `All services (${tickets.length})`}</option>
          {chips.map((c) => (
            <option key={c} value={c}>
              {(CATEGORY_LABELS[c]?.[lang] ?? c)} ({counts.get(c)})
            </option>
          ))}
        </Select>
      </div>

      {!filtered.length && (
        <Card className="p-10 text-center text-muted">
          {lang === "mr" ? "या सेवेसाठी तिकिटे नाहीत." : "No tickets for this service."}
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((t) => (
          <Link key={t.id} href={`/tickets/${t.id}`} className="block">
            <Card className="p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">{t.ticket_number}</span>
                <TicketStatusBadge status={t.status} />
                <Badge tone="primary">{t.current_level}</Badge>
                {t.category && (
                  <Badge tone="neutral">{CATEGORY_LABELS[t.category]?.[lang] ?? t.category}</Badge>
                )}
                <Badge tone={t.priority === "critical" || t.priority === "high" ? "danger" : "neutral"}>
                  {t.priority}
                </Badge>
                {t.sla_due_at && (
                  <Badge tone={new Date(t.sla_due_at) < new Date() ? "danger" : "warning"}>
                    <Clock className="mr-1 inline h-3 w-3" aria-hidden />
                    {formatDate(t.sla_due_at, lang)}
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-medium">{t.subject}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
