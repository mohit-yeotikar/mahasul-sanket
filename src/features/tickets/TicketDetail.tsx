"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, Clock, CheckCircle2, BookPlus, Lock, Sparkles, Wand2, FileText } from "lucide-react";
import { Badge, Button, Card, Field, Input, Spinner, Textarea, cn } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS, ROLE_LABELS } from "@/lib/i18n/dictionaries";
import { TicketStatusBadge } from "./TicketStatusBadge";
import {
  replyAction, escalateAction, setSlaAction, setStatusAction, proposeKnowledgeAction, applyTriageAction,
} from "./actions";
import type { Ticket, UserRole } from "@/types";

interface TriageResult {
  category: string;
  priority: string;
  reason: string;
  draft: string;
  confidence: number;
  citations: { title: string; gr_number: string | null }[];
}

const PRIORITY_LABEL: Record<string, { mr: string; en: string; tone: "neutral" | "warning" | "danger" | "primary" }> = {
  low: { mr: "कमी", en: "Low", tone: "neutral" },
  medium: { mr: "मध्यम", en: "Medium", tone: "primary" },
  high: { mr: "उच्च", en: "High", tone: "warning" },
  critical: { mr: "तातडीचे", en: "Critical", tone: "danger" },
};

interface Reply {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  author: { full_name: string; role: UserRole } | null;
}

const OFFICER_ROLES: UserRole[] = ["nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];

export function TicketDetail({
  ticket, replies, viewerId, viewerRole,
}: {
  ticket: Ticket & { description: string; ai_answer_draft: string | null; source_question: string | null };
  replies: Reply[];
  viewerId: string;
  viewerRole: UserRole;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [replyText, setReplyText] = useState("");
  const [internal, setInternal] = useState(false);
  const [slaDays, setSlaDays] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [proposeQ, setProposeQ] = useState(ticket.source_question ?? ticket.subject);
  const [proposeA, setProposeA] = useState("");
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageErr, setTriageErr] = useState<string>();

  const isOfficer = OFFICER_ROLES.includes(viewerRole);
  const isCreator = ticket.created_by === viewerId;
  const canPropose = viewerRole === "dco" || viewerRole === "nayab_tahsildar";

  const toast = useToast();

  const runTriage = async () => {
    setTriageLoading(true);
    setTriageErr(undefined);
    setTriage(null);
    try {
      const res = await fetch("/api/tickets/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Triage failed");
      setTriage(data as TriageResult);
    } catch (e) {
      setTriageErr(e instanceof Error ? e.message : "Triage failed");
    } finally {
      setTriageLoading(false);
    }
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, successMsg?: string) =>
    startTransition(async () => {
      setError(undefined);
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        if (res.error) toast(res.error, "error");
      } else {
        if (successMsg) toast(successMsg, "success");
        router.refresh();
      }
    });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted">{ticket.ticket_number}</span>
          <TicketStatusBadge status={ticket.status} />
          <Badge tone="primary">{ticket.current_level}</Badge>
          <Badge>{CATEGORY_LABELS[ticket.category]?.[lang] ?? ticket.category}</Badge>
          {ticket.sla_due_at && (
            <Badge tone={new Date(ticket.sla_due_at) < new Date() ? "danger" : "warning"}>
              <Clock className="mr-1 inline h-3 w-3" />
              {lang === "mr" ? "अपेक्षित" : "Due"}: {new Date(ticket.sla_due_at).toLocaleDateString("mr-IN")}
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-xl font-bold">{ticket.subject}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm">{ticket.description}</p>

        {ticket.ai_answer_draft && (
          <div className="mt-4 rounded-lg bg-surface-2 p-3">
            <p className="text-xs font-semibold text-muted">
              AI {lang === "mr" ? "मसुदा उत्तर" : "draft answer"} ({ticket.ai_confidence}%)
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.ai_answer_draft}</p>
          </div>
        )}
      </Card>

      {/* AI smart triage (L2+) */}
      {isOfficer && (
        <Card className="space-y-3 border-primary/20 bg-primary/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="h-4 w-4 text-primary" aria-hidden />
              {lang === "mr" ? "AI स्मार्ट त्रिआज" : "AI smart triage"}
            </p>
            <Button size="sm" variant="outline" disabled={triageLoading} onClick={runTriage}>
              {triageLoading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" aria-hidden />}
              {triage
                ? (lang === "mr" ? "पुन्हा विश्लेषण करा" : "Re-analyze")
                : (lang === "mr" ? "विश्लेषण करा" : "Analyze ticket")}
            </Button>
          </div>

          {!triage && !triageLoading && !triageErr && (
            <p className="text-xs text-muted">
              {lang === "mr"
                ? "AI श्रेणी, प्राधान्य व ज्ञानाधारित मसुदा उत्तर सुचवेल — तुम्ही तपासून लागू करा."
                : "The AI will suggest a category, priority and a knowledge-grounded draft reply — you review and apply."}
            </p>
          )}
          {triageErr && <p className="text-sm text-danger">⚠️ {triageErr}</p>}

          {triage && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">{lang === "mr" ? "सुचवलेली श्रेणी:" : "Suggested category:"}</span>
                <Badge tone="primary">{CATEGORY_LABELS[triage.category]?.[lang] ?? triage.category}</Badge>
                <span className="text-xs text-muted">{lang === "mr" ? "प्राधान्य:" : "Priority:"}</span>
                <Badge tone={PRIORITY_LABEL[triage.priority]?.tone ?? "neutral"}>
                  {PRIORITY_LABEL[triage.priority]?.[lang] ?? triage.priority}
                </Badge>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => applyTriageAction(ticket.id, triage.category, triage.priority),
                      lang === "mr" ? "श्रेणी व प्राधान्य लागू केले ✅" : "Category & priority applied ✅"
                    )
                  }
                >
                  {lang === "mr" ? "लागू करा" : "Apply"}
                </Button>
              </div>
              {triage.reason && <p className="text-sm text-muted">{triage.reason}</p>}

              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-muted">
                    {lang === "mr" ? "मसुदा उत्तर" : "Draft reply"}
                  </p>
                  <Badge tone={triage.confidence >= 60 ? "success" : "warning"}>
                    {lang === "mr" ? "विश्वास" : "Confidence"}: {triage.confidence}%
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm">{triage.draft}</p>
                {!!triage.citations.length && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {triage.citations.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        <FileText className="h-3 w-3" aria-hidden />
                        {c.title.length > 40 ? c.title.slice(0, 40) + "…" : c.title}
                        {c.gr_number ? ` · GR ${c.gr_number}` : ""}
                      </span>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setReplyText(triage.draft);
                    toast(lang === "mr" ? "मसुदा उत्तर बॉक्समध्ये भरले — तपासून पाठवा" : "Draft loaded into the reply box — review & send", "success");
                  }}
                >
                  {lang === "mr" ? "मसुदा उत्तर वापरा" : "Use as reply"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Officer controls */}
      {isOfficer && (
        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold">{lang === "mr" ? "अधिकारी कृती" : "Officer actions"}</p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t("slaDays")}>
              <Input
                type="number" min={1} max={90} value={slaDays}
                onChange={(e) => setSlaDays(e.target.value)}
                className="w-32"
              />
            </Field>
            <Button
              variant="outline"
              disabled={pending || !slaDays}
              onClick={() =>
                run(
                  () => setSlaAction(ticket.id, Number(slaDays)),
                  lang === "mr" ? `निराकरण कालावधी ${slaDays} दिवस — तक्रारदाराला सूचना पाठवली` : `Resolution time set: ${slaDays} days — requester notified`
                )
              }
            >
              {t("setSla")}
            </Button>
            <Button
              variant="secondary"
              disabled={pending || ticket.status === "resolved"}
              onClick={() =>
                run(
                  () => setStatusAction(ticket.id, "resolved"),
                  lang === "mr" ? "तिकीट निराकरण झाले ✅" : "Ticket resolved ✅"
                )
              }
            >
              <CheckCircle2 className="h-4 w-4" /> {t("resolve")}
            </Button>
            {canPropose && (
              <Button variant="outline" onClick={() => setShowPropose((s) => !s)}>
                <BookPlus className="h-4 w-4" /> {t("proposeKnowledge")}
              </Button>
            )}
          </div>

          {showPropose && (
            <div className="space-y-3 rounded-lg bg-surface-2 p-3">
              <p className="text-xs text-muted">
                {lang === "mr"
                  ? "हा प्रश्न सर्वांना लागू असल्यास ज्ञान भांडारात प्रस्तावित करा — प्रशासकाच्या मंजुरीनंतर AI ला उपलब्ध होईल."
                  : "If this Q&A is generic, propose it — after Admin approval it becomes AI knowledge."}
              </p>
              <Field label={lang === "mr" ? "प्रश्न" : "Question"}>
                <Textarea rows={2} value={proposeQ} onChange={(e) => setProposeQ(e.target.value)} />
              </Field>
              <Field label={lang === "mr" ? "अधिकृत उत्तर" : "Official answer"}>
                <Textarea rows={4} value={proposeA} onChange={(e) => setProposeA(e.target.value)} />
              </Field>
              <Button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const res = await proposeKnowledgeAction(ticket.id, proposeQ, proposeA);
                    if (res.ok) setShowPropose(false);
                    return res;
                  }, lang === "mr" ? "ज्ञान प्रस्ताव प्रशासकाकडे पाठवला 📚" : "Knowledge proposal sent to Admin 📚")
                }
              >
                {lang === "mr" ? "प्रस्ताव पाठवा" : "Submit proposal"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Creator: escalate when unsatisfied */}
      {isCreator && ticket.current_level !== "L4" && ["resolved", "in_progress", "waiting", "closed"].includes(ticket.status) && (
        <Card className="p-4">
          {!showEscalate ? (
            <Button variant="accent" onClick={() => setShowEscalate(true)}>
              <ArrowUpCircle className="h-4 w-4" /> {t("escalate")} ({ticket.current_level} → {ticket.current_level === "L2" ? "L3 DCO" : "L4 Admin"})
            </Button>
          ) : (
            <div className="space-y-3">
              <Field label={lang === "mr" ? "वरिष्ठ स्तरावर पाठवण्याचे कारण" : "Reason for escalation"}>
                <Textarea rows={2} value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="accent" disabled={pending}
                  onClick={() =>
                    run(
                      () => escalateAction(ticket.id, escalateReason),
                      lang === "mr" ? "तिकीट वरिष्ठ स्तरावर पाठवले — संबंधित अधिकाऱ्याला सूचना गेली" : "Escalated — the senior officer has been notified"
                    )
                  }
                >
                  {t("escalate")}
                </Button>
                <Button variant="outline" onClick={() => setShowEscalate(false)}>{t("cancel")}</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Conversation */}
      <div className="space-y-3">
        {replies.map((r) => (
          <Card key={r.id} className={cn("p-4", r.is_internal && "border-warning bg-warning/5")}>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="font-semibold text-foreground">{r.author?.full_name ?? "—"}</span>
              {r.author && <span>{ROLE_LABELS[r.author.role]?.[lang]}</span>}
              <span>{new Date(r.created_at).toLocaleString("mr-IN")}</span>
              {r.is_internal && (
                <Badge tone="warning"><Lock className="mr-1 inline h-3 w-3" />{lang === "mr" ? "अंतर्गत" : "Internal"}</Badge>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
          </Card>
        ))}
      </div>

      {/* Reply box */}
      {ticket.status !== "closed" && (
        <Card className="space-y-3 p-4">
          <Textarea
            rows={3}
            placeholder={t("reply")}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button
              disabled={pending || !replyText.trim()}
              onClick={() =>
                run(async () => {
                  const res = await replyAction({ ticketId: ticket.id, body: replyText, isInternal: internal });
                  if (res.ok) setReplyText("");
                  return res;
                }, lang === "mr" ? "उत्तर पाठवले ✉️" : "Reply sent ✉️")
              }
            >
              {pending ? <Spinner /> : t("reply")}
            </Button>
            {isOfficer && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                {lang === "mr" ? "अंतर्गत टीप (तलाठ्यांना दिसणार नाही)" : "Internal note (hidden from Talathi)"}
              </label>
            )}
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </Card>
      )}
    </div>
  );
}
