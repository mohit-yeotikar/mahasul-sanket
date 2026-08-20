"use client";

import { useEffect, useState } from "react";
import { ToggleLeft, Save, ShieldCheck } from "lucide-react";
import { Button, Card, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

interface Def { key: string; mr: string; en: string; def: boolean }

export function FeatureFlagsPanel() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [defs, setDefs] = useState<Def[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [err, setErr] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/feature-flags");
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        const data = await res.json();
        setDefs(data.defs);
        setFlags(data.flags);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true); setMsg(undefined); setErr(undefined);
    try {
      const res = await fetch("/api/admin/feature-flags", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flags }) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setMsg(M ? "जतन झाले — बदल ~30 सेकंदात लागू होतील." : "Saved — changes apply within ~30s.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 p-6 text-muted"><Spinner className="h-4 w-4" />{M ? "लोड करत आहे…" : "Loading…"}</div>;
  if (err && !defs.length) return <p className="p-6 text-danger">⚠️ {err}</p>;

  return (
    <div className="space-y-4">
      <Card className="divide-y divide-border p-0">
        {defs.map((d) => {
          const on = flags[d.key] ?? d.def;
          return (
            <div key={d.key} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <ToggleLeft className={`h-5 w-5 ${on ? "text-primary" : "text-muted"}`} aria-hidden />
                <p className="font-medium">{M ? d.mr : d.en}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                onClick={() => setFlags({ ...flags, [d.key]: !on })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-surface-2"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
              </button>
            </div>
          );
        })}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" aria-hidden />}
          {M ? "जतन करा" : "Save flags"}
        </Button>
        {msg && <span className="inline-flex items-center gap-1.5 text-sm text-primary"><ShieldCheck className="h-4 w-4" aria-hidden />{msg}</span>}
        {err && <span className="text-sm text-danger">{err}</span>}
      </div>
    </div>
  );
}
