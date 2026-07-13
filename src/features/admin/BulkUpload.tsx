"use client";

import { useCallback, useRef, useState } from "react";
import {
  UploadCloud, FileText, CheckCircle2, Copy, XCircle, Loader2, Sparkles,
} from "lucide-react";
import { Badge, Button, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";

const ACCEPT = ".pdf,.docx,.md,.markdown,.txt,.csv,.tsv,.html,.htm,.json,.log";

type Status = "queued" | "processing" | "indexed" | "duplicate" | "failed";
interface Item {
  name: string;
  status: Status;
  title?: string;
  category?: string;
  chunks?: number;
  grNumber?: string | null;
  reason?: string;
  error?: string;
}

export function BulkUpload() {
  const { lang } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const next = [...prev];
      for (const f of Array.from(list)) if (!seen.has(f.name + f.size)) next.push(f);
      return next;
    });
  }, []);

  const run = async () => {
    if (!files.length) return;
    setRunning(true);
    setItems(files.map((f) => ({ name: f.name, status: "queued" as Status })));

    for (let i = 0; i < files.length; i++) {
      setItems((prev) => prev.map((it, j) => (j === i ? { ...it, status: "processing" } : it)));
      try {
        const fd = new FormData();
        fd.append("file", files[i]);
        const res = await fetch("/api/admin/bulk-ingest", { method: "POST", body: fd });
        const data = await res.json();
        setItems((prev) =>
          prev.map((it, j) =>
            j === i
              ? {
                  name: files[i].name,
                  status: (data.status as Status) ?? "failed",
                  title: data.title,
                  category: data.category,
                  chunks: data.chunks,
                  grNumber: data.grNumber,
                  reason: data.reason,
                  error: data.error,
                }
              : it
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((it, j) => (j === i ? { ...it, status: "failed", error: "Network error" } : it))
        );
      }
    }
    setRunning(false);
    setFiles([]);
  };

  const counts = items.reduce(
    (a, it) => ((a[it.status] = (a[it.status] ?? 0) + 1), a),
    {} as Record<Status, number>
  );
  const done = items.filter((i) => i.status !== "queued" && i.status !== "processing").length;

  const statusMeta: Record<Status, { icon: React.ComponentType<{ className?: string }>; tone: "neutral" | "success" | "warning" | "danger" | "primary"; mr: string; en: string }> = {
    queued: { icon: FileText, tone: "neutral", mr: "रांगेत", en: "Queued" },
    processing: { icon: Loader2, tone: "primary", mr: "प्रक्रिया सुरू…", en: "Processing…" },
    indexed: { icon: CheckCircle2, tone: "success", mr: "समाविष्ट", en: "Indexed" },
    duplicate: { icon: Copy, tone: "warning", mr: "डुप्लिकेट", en: "Duplicate" },
    failed: { icon: XCircle, tone: "danger", mr: "अयशस्वी", en: "Failed" },
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-surface-2"
        )}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-primary" aria-hidden />
        <p className="font-medium">
          {lang === "mr" ? "GR / परिपत्रके येथे ओढा किंवा निवडा" : "Drag GRs / circulars here, or click to select"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {lang === "mr"
            ? "PDF, Word, Markdown, TXT, CSV, HTML — एकाच वेळी अनेक फाइल्स"
            : "PDF, Word, Markdown, TXT, CSV, HTML — many files at once"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Selected files + action */}
      {!!files.length && !running && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
          <p className="text-sm">
            <span className="font-semibold">{files.length}</span>{" "}
            {lang === "mr" ? "फाइल्स निवडल्या" : "files selected"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFiles([])}>
              {lang === "mr" ? "साफ करा" : "Clear"}
            </Button>
            <Button size="sm" onClick={run}>
              <Sparkles className="h-4 w-4" />
              {lang === "mr" ? "अपलोड करा व अनुक्रमित करा" : "Upload & auto-index"}
            </Button>
          </div>
        </div>
      )}

      {/* Progress summary */}
      {running && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            {lang === "mr"
              ? `प्रक्रिया सुरू आहे… ${done}/${items.length}`
              : `Processing… ${done}/${items.length}`}
          </div>
          <p className="mt-1 text-xs text-muted">
            {lang === "mr"
              ? "प्रत्येक दस्तऐवज AI द्वारे ओळखला, शीर्षक/प्रकार नेमला व अनुक्रमित केला जात आहे."
              : "Each document is being identified, titled, categorised and indexed by AI."}
          </p>
        </div>
      )}

      {/* Results */}
      {!!items.length && (
        <div className="space-y-2">
          {!running && (
            <div className="flex flex-wrap gap-2 text-sm">
              {counts.indexed ? <Badge tone="success">{lang === "mr" ? "समाविष्ट" : "Indexed"}: {counts.indexed}</Badge> : null}
              {counts.duplicate ? <Badge tone="warning">{lang === "mr" ? "डुप्लिकेट" : "Duplicates"}: {counts.duplicate}</Badge> : null}
              {counts.failed ? <Badge tone="danger">{lang === "mr" ? "अयशस्वी" : "Failed"}: {counts.failed}</Badge> : null}
            </div>
          )}
          {items.map((it, i) => {
            const m = statusMeta[it.status];
            return (
              <Card key={i} className="p-3">
                <div className="flex items-start gap-3">
                  <m.icon className={cn("mt-0.5 h-5 w-5 shrink-0", it.status === "processing" && "animate-spin",
                    it.status === "indexed" && "text-success", it.status === "duplicate" && "text-warning",
                    it.status === "failed" && "text-danger", it.status === "queued" && "text-muted",
                    it.status === "processing" && "text-primary")} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.title || it.name}</p>
                    <p className="truncate text-xs text-muted">{it.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={m.tone}>{lang === "mr" ? m.mr : m.en}</Badge>
                      {it.status === "indexed" && it.category && (
                        <Badge tone="primary">{CATEGORY_LABELS[it.category]?.[lang] ?? it.category}</Badge>
                      )}
                      {it.status === "indexed" && it.grNumber && <Badge>{it.grNumber}</Badge>}
                      {it.status === "indexed" && it.chunks != null && (
                        <span className="text-xs text-muted">{it.chunks} {lang === "mr" ? "भाग" : "chunks"}</span>
                      )}
                      {it.status === "duplicate" && it.reason && (
                        <span className="text-xs text-warning">{it.reason}</span>
                      )}
                      {it.status === "failed" && it.error && (
                        <span className="text-xs text-danger">{it.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
