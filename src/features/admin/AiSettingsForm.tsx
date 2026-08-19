"use client";

// L6 Super/State Admin — runtime AI configuration. Switch provider, chat model,
// temperature and the confidence threshold WITHOUT a redeploy. Changes are
// written to app_settings.ai and take effect within ~30s (settings TTL).

import { useEffect, useState } from "react";
import {
  Sparkles, Cpu, Thermometer, Gauge, ShieldCheck, FlaskConical,
  Save, CheckCircle2, AlertTriangle, Lock,
} from "lucide-react";
import { Button, Card, Select, Input, Badge, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/motion";

interface Settings {
  provider: string;
  chat_model: string;
  embedding_model: string;
  temperature: number;
  confidence_threshold: number;
  configured: boolean;
  updated_at?: string | null;
}

const PROVIDER_LABEL: Record<string, string> = {
  "grok-oauth": "Grok · SuperGrok OAuth",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  xai: "xAI · Grok (API key)",
  openai: "OpenAI-compatible",
  selfhosted: "Self-hosted (OpenAI-compatible)",
};

export function AiSettingsForm() {
  const { lang } = useLang();
  const M = lang === "mr";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const [env, setEnv] = useState<Settings | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // editable fields
  const [provider, setProvider] = useState("");
  const [chatModel, setChatModel] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [threshold, setThreshold] = useState(60);
  const [embedding, setEmbedding] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/ai-settings");
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
        const data = await res.json();
        const s: Settings = data.settings;
        setEnv(data.env);
        setProviders(data.providers);
        setProvider(s.provider);
        setChatModel(s.chat_model);
        setTemperature(s.temperature);
        setThreshold(s.confidence_threshold);
        setEmbedding(s.embedding_model);
        setConfigured(s.configured);
        setUpdatedAt(s.updated_at ?? null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", provider, chat_model: chatModel, temperature }),
      });
      const data = await res.json();
      setTestResult(
        data.ok
          ? { ok: true, text: (M ? "यशस्वी — प्रतिसाद: " : "Success — reply: ") + (data.reply || "OK") }
          : { ok: false, text: data.error ?? "Test failed" }
      );
    } catch (e) {
      setTestResult({ ok: false, text: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg(undefined);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          chat_model: chatModel,
          temperature,
          confidence_threshold: threshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setConfigured(true);
      setUpdatedAt(data.settings.updated_at ?? new Date().toISOString());
      setSaveMsg(M ? "जतन झाले — बदल ~30 सेकंदात लागू होतील." : "Saved — changes apply within ~30s.");
    } catch (e) {
      setSaveMsg((M ? "त्रुटी: " : "Error: ") + (e instanceof Error ? e.message : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 p-8 text-muted">
        <Spinner className="h-4 w-4" /> {M ? "लोड करत आहे…" : "Loading…"}
      </div>
    );
  }
  if (err) {
    return <div className="mx-auto max-w-3xl p-8 text-danger">⚠️ {err}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-fg">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold">{M ? "AI सेटिंग्ज" : "AI Settings"}</h1>
              <p className="text-sm text-muted">
                {M
                  ? "मॉडेल, प्रदाता व अचूकता — रीडिप्लॉयशिवाय बदला."
                  : "Model, provider & accuracy — change without a redeploy."}
              </p>
            </div>
          </div>
          <Badge tone={configured ? "success" : "warning"}>
            {configured
              ? (M ? "प्रशासकाने सेट केले" : "Admin-configured")
              : (M ? "पर्यावरण डीफॉल्ट वापरत आहे" : "Using environment defaults")}
          </Badge>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="space-y-5 p-6">
          {/* Provider */}
          <label className="block space-y-1.5">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="h-4 w-4 text-primary" aria-hidden />
              {M ? "AI प्रदाता" : "AI provider"}
            </span>
            <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
              {providers.map((p) => (
                <option key={p} value={p}>{PROVIDER_LABEL[p] ?? p}</option>
              ))}
            </Select>
            <span className="text-xs text-muted">
              {M ? "पर्यावरण डीफॉल्ट: " : "Environment default: "}<code>{env?.provider}</code>
            </span>
          </label>

          {/* Chat model */}
          <label className="block space-y-1.5">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              {M ? "चॅट मॉडेल" : "Chat model"}
            </span>
            <Input
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              placeholder={env?.chat_model || (M ? "प्रदात्याचे डीफॉल्ट" : "provider default")}
            />
            <span className="text-xs text-muted">
              {M
                ? "उदा. grok-4, gemini-flash-latest. रिकामे = प्रदात्याचे डीफॉल्ट."
                : "e.g. grok-4, gemini-flash-latest. Empty = provider default."}
            </span>
          </label>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Thermometer className="h-4 w-4 text-primary" aria-hidden />
                {M ? "तापमान (सर्जनशीलता)" : "Temperature (creativity)"}
              </span>
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-sm font-bold tabular-nums">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.05} value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary"
            />
            <span className="text-xs text-muted">
              {M ? "कमी = अचूक/सुसंगत, जास्त = सर्जनशील. शिफारस 0.2." : "Lower = precise/consistent, higher = creative. Recommended 0.2."}
            </span>
          </div>

          {/* Confidence threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="h-4 w-4 text-primary" aria-hidden />
                {M ? "एस्केलेशन विश्वास मर्यादा" : "Escalation confidence threshold"}
              </span>
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-sm font-bold tabular-nums">{threshold}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={1} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary"
            />
            <span className="text-xs text-muted">
              {M
                ? "याखालील विश्वास असलेली उत्तरे एस्केलेशनसाठी सुचवली जातात."
                : "Answers below this confidence are flagged for escalation."}
            </span>
          </div>

          {/* Embedding — pinned */}
          <div className="rounded-xl border border-border bg-surface-2/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-muted" aria-hidden />
              {M ? "एम्बेडिंग मॉडेल (पिन केलेले)" : "Embedding model (pinned)"}
            </div>
            <p className="mt-1 font-mono text-sm">{embedding}</p>
            <p className="mt-1 text-xs text-muted">
              {M
                ? "हे बदलल्यास संपूर्ण ज्ञानकोश पुन्हा इंडेक्स करावा लागेल — म्हणून येथे बदलता येत नाही."
                : "Changing this would require re-indexing the whole knowledge base — so it is not editable here."}
            </p>
          </div>
        </Card>
      </Reveal>

      {/* Actions */}
      <Reveal delay={0.1}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={runTest} disabled={testing}>
            {testing ? <Spinner className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" aria-hidden />}
            {M ? "कनेक्शन तपासा" : "Test connection"}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" aria-hidden />}
            {M ? "जतन करा" : "Save settings"}
          </Button>
          {updatedAt && (
            <span className="text-xs text-muted">
              {M ? "शेवटचा बदल: " : "Last updated: "}
              {new Date(updatedAt).toLocaleString(M ? "mr-IN" : "en-IN")}
            </span>
          )}
        </div>
      </Reveal>

      {testResult && (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
          testResult.ok ? "border-success/30 bg-success/5 text-success" : "border-danger/30 bg-danger/5 text-danger"
        }`}>
          {testResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          <span className="break-words">{testResult.text}</span>
        </div>
      )}
      {saveMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm text-primary">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          {saveMsg}
        </div>
      )}
    </div>
  );
}
