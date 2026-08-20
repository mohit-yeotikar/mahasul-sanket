"use client";

// L1 Talathi — AI draft generator. Pick a draft type, fill the fields, get a
// ready-to-edit official draft in Marathi. Copy to clipboard when done.

import { useState } from "react";
import { FileSignature, Sparkles, Copy, Check } from "lucide-react";
import { Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { DRAFT_TYPES } from "./draft-specs";

export function DraftGenerator() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [typeKey, setTypeKey] = useState(DRAFT_TYPES[0].key);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [copied, setCopied] = useState(false);

  const type = DRAFT_TYPES.find((t) => t.key === typeKey)!;

  const generate = async () => {
    setBusy(true); setErr(undefined); setDraft(""); setCopied(false);
    try {
      const res = await fetch("/api/officer/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: typeKey, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDraft(data.draft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <label className="block space-y-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold"><FileSignature className="h-4 w-4 text-primary" aria-hidden />{M ? "मसुदा प्रकार" : "Draft type"}</span>
          <Select value={typeKey} onChange={(e) => { setTypeKey(e.target.value); setFields({}); setDraft(""); }}>
            {DRAFT_TYPES.map((t) => <option key={t.key} value={t.key}>{M ? t.mr : t.en}</option>)}
          </Select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {type.fields.map((f) => (
            <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
              <Field label={M ? f.mr : f.en}>
                {f.textarea ? (
                  <Textarea rows={3} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
                ) : (
                  <Input value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
                )}
              </Field>
            </div>
          ))}
        </div>

        <Button disabled={busy} onClick={generate}>
          {busy ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" aria-hidden />}
          {M ? "मसुदा तयार करा" : "Generate draft"}
        </Button>
        {err && <p className="text-sm text-danger">⚠️ {err}</p>}
      </Card>

      {draft && (
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{M ? "तयार मसुदा" : "Generated draft"}</p>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? (M ? "कॉपी झाले" : "Copied") : (M ? "कॉपी करा" : "Copy")}
            </Button>
          </div>
          <Textarea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} className="font-[inherit] text-sm leading-relaxed" />
          <p className="text-xs text-muted">{M ? "AI मसुदा — पाठवण्यापूर्वी तपासा व दुरुस्त करा." : "AI draft — review and edit before use."}</p>
        </Card>
      )}
    </div>
  );
}
