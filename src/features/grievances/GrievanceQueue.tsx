"use client";

// Officer grievance queue — list citizen grievances for the officer's district,
// update status and add a note (visible to the citizen when they track).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Phone, Save } from "lucide-react";
import { Badge, Button, Card, Select, Spinner, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";
import { updateGrievanceAction } from "./actions";

export interface GrievanceRow {
  id: string;
  reference: string;
  citizen_name: string;
  mobile: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  officer_note: string | null;
  created_at: string;
  taluka: { name_mr?: string; name_en?: string } | null;
}

const STATUS: Record<string, { mr: string; en: string; tone: "neutral" | "warning" | "primary" | "success" }> = {
  received: { mr: "प्राप्त", en: "Received", tone: "warning" },
  in_review: { mr: "तपासणी सुरू", en: "Under review", tone: "primary" },
  resolved: { mr: "निराकरण", en: "Resolved", tone: "success" },
  closed: { mr: "बंद", en: "Closed", tone: "neutral" },
};

export function GrievanceQueue({ grievances }: { grievances: GrievanceRow[] }) {
  const { lang } = useLang();
  const M = lang === "mr";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{M ? "नागरिक तक्रारी" : "Citizen grievances"}</h1>
          <p className="text-sm text-muted">{M ? "तुमच्या जिल्ह्यातील तक्रारी व्यवस्थापित करा." : "Manage grievances for your district."}</p>
        </div>
      </div>

      {!grievances.length && (
        <Card className="p-8 text-center text-sm text-muted">
          {M ? "सध्या कोणतीही तक्रार नाही." : "No grievances right now."}
        </Card>
      )}

      {grievances.map((g) => (
        <GrievanceCard key={g.id} g={g} M={M} lang={lang} />
      ))}
    </div>
  );
}

function GrievanceCard({ g, M, lang }: { g: GrievanceRow; M: boolean; lang: "mr" | "en" }) {
  const [status, setStatus] = useState(g.status);
  const [note, setNote] = useState(g.officer_note ?? "");
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const save = () =>
    startTransition(async () => {
      const res = await updateGrievanceAction(g.id, status, note);
      if (res.ok) {
        toast(M ? "तक्रार अद्यतनित केली ✅" : "Grievance updated ✅", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Error", "error");
      }
    });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted">{g.reference}</span>
        <Badge tone={STATUS[g.status]?.tone ?? "neutral"}>{M ? STATUS[g.status]?.mr : STATUS[g.status]?.en}</Badge>
        <Badge>{CATEGORY_LABELS[g.category]?.[lang] ?? g.category}</Badge>
        {g.taluka && <span className="text-xs text-muted">{M ? g.taluka.name_mr : g.taluka.name_en}</span>}
      </div>
      <h2 className="mt-2 font-bold">{g.subject}</h2>
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{g.description}</p>
      <p className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-medium">{g.citizen_name}</span>
        <a href={`tel:${g.mobile}`} className="inline-flex items-center gap-1 text-primary hover:underline">
          <Phone className="h-3.5 w-3.5" aria-hidden />{g.mobile}
        </a>
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">{M ? "स्थिती" : "Status"}</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.keys(STATUS).map((s) => (
              <option key={s} value={s}>{M ? STATUS[s].mr : STATUS[s].en}</option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">{M ? "टीप (नागरिकाला दिसेल)" : "Note (visible to citizen)"}</span>
          <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[2.5rem]" />
        </label>
        <Button disabled={pending} onClick={save}>
          {pending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" aria-hidden />}
          {M ? "जतन" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
