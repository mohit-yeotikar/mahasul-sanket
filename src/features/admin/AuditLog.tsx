"use client";

// L4 audit log browser — search across actor / action / entity, filter by
// action type, and export the filtered view to CSV.

import { useMemo, useState } from "react";
import { Search, Download, ScrollText } from "lucide-react";
import { Card, Input, Select, Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

export interface AuditRow {
  id: number;
  created_at: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  actor_name: string;
  actor_role: string | null;
}

function toCsv(rows: AuditRow[]): string {
  const header = ["Timestamp", "Actor", "Role", "Action", "Entity", "Entity ID"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [new Date(r.created_at).toISOString(), r.actor_name, r.actor_role, r.action, r.entity, r.entity_id].map(esc).join(",")
  );
  return [header.join(","), ...body].join("\n");
}

export function AuditLog({ logs }: { logs: AuditRow[] }) {
  const { lang } = useLang();
  const M = lang === "mr";
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (action && l.action !== action) return false;
      if (!s) return true;
      return (
        l.actor_name.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        (l.entity ?? "").toLowerCase().includes(s) ||
        (l.entity_id ?? "").toLowerCase().includes(s)
      );
    });
  }, [logs, q, action]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={M ? "अधिकारी, कृती किंवा घटक शोधा…" : "Search actor, action or entity…"} className="pl-9" />
        </div>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto min-w-[10rem]">
          <option value="">{M ? "सर्व कृती" : "All actions"}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="h-4 w-4" aria-hidden />CSV
        </Button>
      </div>

      <p className="text-xs text-muted">{filtered.length} {M ? "नोंदी" : "entries"}</p>

      <Card className="divide-y divide-border">
        {!filtered.length && (
          <p className="flex items-center justify-center gap-2 p-6 text-center text-sm text-muted">
            <ScrollText className="h-4 w-4" aria-hidden />{M ? "जुळणाऱ्या नोंदी नाहीत." : "No matching entries."}
          </p>
        )}
        {filtered.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="font-mono text-xs text-muted">{new Date(l.created_at).toLocaleString(M ? "mr-IN" : "en-IN")}</span>
            <span className="font-medium">{l.actor_name}</span>
            <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">{l.action}</span>
            {l.entity && <span className="text-muted">{l.entity}</span>}
          </div>
        ))}
      </Card>
    </div>
  );
}
