"use client";

// AI-assisted knowledge approval — flags existing approved knowledge that looks
// similar to what's about to be approved (possible duplicate / conflict), so the
// admin reviews before adding it. Runs a keyword search (no embeddings needed).

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

interface Match {
  document_id: string;
  title: string;
  gr_number: string | null;
  similarity: number;
  snippet: string;
}

export function DuplicateCheck({ text, excludeDocId }: { text: string; excludeDocId?: string }) {
  const { lang } = useLang();
  const M = lang === "mr";
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/similar-knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 1000), excludeDocId }),
        });
        const data = await res.json();
        if (alive) setMatches(data.matches ?? []);
      } catch {
        if (alive) setMatches([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [text, excludeDocId]);

  if (loading) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {M ? "समान ज्ञान तपासत आहे…" : "Checking for duplicates…"}
      </p>
    );
  }
  if (!matches || !matches.length) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-success">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {M ? "समान नोंद आढळली नाही" : "No similar entry found"}
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-warning">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {M ? "संभाव्य डुप्लिकेट / संघर्ष — मंजुरीपूर्वी तपासा" : "Possible duplicate / conflict — review before approving"}
      </p>
      <ul className="mt-1.5 space-y-1">
        {matches.map((m) => (
          <li key={m.document_id} className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="font-medium">{m.title}</span>
              {m.gr_number ? ` · GR ${m.gr_number}` : ""}
            </span>
            <span className="shrink-0 rounded bg-warning/15 px-1.5 font-semibold text-warning">{m.similarity}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
