"use client";

// Citizen tool — lightweight grievance: submit without login (get a GRV
// reference) and track by reference + mobile. Backend: /api/public/grievance.

import { useEffect, useState } from "react";
import { Send, Search, CheckCircle2, Loader2, Circle, ClipboardCheck, Info } from "lucide-react";
import { Input, Textarea, Select, Button, Spinner, Field } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";

interface Geo { id: string; name_mr: string; name_en: string; }

const CATEGORIES = [
  "seven_twelve", "ferfar", "mutation", "inheritance", "crop_entry",
  "revenue", "survey", "map", "certificates", "digital_signature", "technical_issue", "others",
];

const STATUS_STEPS = ["received", "in_review", "resolved"] as const;
const STATUS_LABEL: Record<string, { mr: string; en: string }> = {
  received: { mr: "प्राप्त झाली", en: "Received" },
  in_review: { mr: "तपासणी सुरू", en: "Under review" },
  resolved: { mr: "निराकरण झाले", en: "Resolved" },
  closed: { mr: "बंद केले", en: "Closed" },
};

export function Grievance() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [mode, setMode] = useState<"submit" | "track">("submit");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-surface p-1">
        {(["submit", "track"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === m ? "bg-primary text-primary-fg" : "text-muted hover:text-foreground"
            }`}
          >
            {m === "submit" ? (M ? "तक्रार नोंदवा" : "Submit") : (M ? "स्थिती पहा" : "Track")}
          </button>
        ))}
      </div>

      {mode === "submit" ? <SubmitForm M={M} lang={lang} /> : <TrackForm M={M} />}
    </div>
  );
}

function SubmitForm({ M, lang }: { M: boolean; lang: "mr" | "en" }) {
  const [districts, setDistricts] = useState<Geo[]>([]);
  const [talukas, setTalukas] = useState<Geo[]>([]);
  const [form, setForm] = useState({
    citizen_name: "", mobile: "", district_id: "", taluka_id: "",
    category: "others", subject: "", description: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [reference, setReference] = useState<string>();

  useEffect(() => {
    fetch("/api/public/officers?mode=districts").then((r) => r.json()).then((d) => setDistricts(d.districts ?? [])).catch(() => {});
  }, []);

  const onDistrict = (id: string) => {
    setForm((f) => ({ ...f, district_id: id, taluka_id: "" }));
    setTalukas([]);
    if (id) fetch(`/api/public/officers?mode=talukas&district=${id}`).then((r) => r.json()).then((d) => setTalukas(d.talukas ?? [])).catch(() => {});
  };

  const submit = async () => {
    setBusy(true); setErr(undefined);
    try {
      const res = await fetch("/api/public/grievance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          district_id: form.district_id || null,
          taluka_id: form.taluka_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setReference(data.reference);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <p className="mt-3 font-semibold">{M ? "तुमची तक्रार नोंदवली गेली" : "Your grievance has been submitted"}</p>
        <p className="mt-1 text-sm text-muted">{M ? "हा संदर्भ क्रमांक जपून ठेवा — स्थिती पाहण्यासाठी लागेल." : "Save this reference number — you'll need it to track the status."}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2 font-mono text-lg font-bold">
          <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden />{reference}
        </p>
      </div>
    );
  }

  const valid = form.citizen_name.trim().length >= 2 && /^[0-9]{10}$/.test(form.mobile) && form.subject.trim().length >= 5 && form.description.trim().length >= 10;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={M ? "तुमचे नाव" : "Your name"} required>
          <Input value={form.citizen_name} onChange={(e) => setForm({ ...form, citizen_name: e.target.value })} />
        </Field>
        <Field label={M ? "मोबाइल क्रमांक" : "Mobile number"} required>
          <Input inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} placeholder="9XXXXXXXXX" />
        </Field>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{M ? "जिल्हा" : "District"}</span>
          <Select value={form.district_id} onChange={(e) => onDistrict(e.target.value)}>
            <option value="">{M ? "निवडा" : "Select"}</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{M ? d.name_mr : d.name_en}</option>)}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{M ? "तालुका" : "Taluka"}</span>
          <Select value={form.taluka_id} onChange={(e) => setForm({ ...form, taluka_id: e.target.value })} disabled={!form.district_id}>
            <option value="">{M ? "निवडा" : "Select"}</option>
            {talukas.map((t) => <option key={t.id} value={t.id}>{M ? t.name_mr : t.name_en}</option>)}
          </Select>
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{M ? "विषय / प्रकार" : "Category"}</span>
        <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]?.[lang] ?? c}</option>)}
        </Select>
      </label>
      <Field label={M ? "तक्रारीचा विषय" : "Subject"} required>
        <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      </Field>
      <Field label={M ? "तपशील" : "Details"} required>
        <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>

      {err && <p className="text-sm text-danger">⚠️ {err}</p>}
      <Button disabled={!valid || busy} onClick={submit}>
        {busy ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden />}
        {M ? "तक्रार पाठवा" : "Submit grievance"}
      </Button>
    </div>
  );
}

function TrackForm({ M }: { M: boolean }) {
  const [reference, setReference] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ found: boolean; grievance?: { reference: string; subject: string; status: string; officer_note: string | null; updated_at: string } } | null>(null);

  const track = async () => {
    if (!reference.trim() || !/^[0-9]{10}$/.test(mobile)) return;
    setBusy(true); setResult(null);
    try {
      const res = await fetch(`/api/public/grievance?reference=${encodeURIComponent(reference.trim())}&mobile=${mobile}`);
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const g = result?.grievance;
  const stepIndex = g ? (g.status === "closed" ? STATUS_STEPS.length - 1 : STATUS_STEPS.indexOf(g.status as typeof STATUS_STEPS[number])) : -1;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={M ? "संदर्भ क्रमांक (GRV-…)" : "Reference (GRV-…)"} />
        <Input inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} placeholder={M ? "मोबाइल क्रमांक" : "Mobile number"} />
        <Button onClick={track} disabled={busy || !reference.trim() || !/^[0-9]{10}$/.test(mobile)}>
          {busy ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" aria-hidden />}{M ? "पहा" : "Track"}
        </Button>
      </div>

      {result && !result.found && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          <Info className="h-4 w-4" aria-hidden />
          {M ? "या क्रमांक व मोबाइलसाठी तक्रार आढळली नाही." : "No grievance found for that reference and mobile."}
        </p>
      )}

      {g && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">{M ? "क्रमांक" : "Reference"}: <span className="font-mono font-semibold text-foreground">{g.reference}</span></p>
          <p className="mt-1 font-semibold">{g.subject}</p>
          <ol className="mt-4 space-y-0">
            {STATUS_STEPS.map((s, i) => {
              const done = i < stepIndex; const current = i === stepIndex;
              return (
                <li key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden /> : current ? <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden /> : <Circle className="h-6 w-6 text-border" aria-hidden />}
                    {i < STATUS_STEPS.length - 1 && <span className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} style={{ minHeight: 22 }} />}
                  </div>
                  <div className={`pb-4 ${done || current ? "" : "opacity-50"}`}>
                    <p className={`text-sm font-semibold ${current ? "text-accent" : ""}`}>{M ? STATUS_LABEL[s].mr : STATUS_LABEL[s].en}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {g.status === "closed" && <p className="text-sm font-semibold text-muted">{M ? STATUS_LABEL.closed.mr : STATUS_LABEL.closed.en}</p>}
          {g.officer_note && (
            <div className="mt-2 rounded-lg bg-surface-2 p-3 text-sm">
              <p className="text-xs font-semibold text-muted">{M ? "अधिकाऱ्याची टीप" : "Officer note"}</p>
              <p className="mt-1">{g.officer_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
