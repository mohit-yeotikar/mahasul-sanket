"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send, Mic, MicOff, Copy, Plus,
  FileText, TriangleAlert, History, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Card, Skeleton, Spinner, Textarea, cn } from "@/components/ui";
import { RichText } from "@/components/ui/RichText";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useSpeech } from "@/features/voice/useSpeech";
import { useToast } from "@/components/ui/Toast";
import type { ChatAnswer, Citation } from "@/types";

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  citations?: Citation[];
  related_questions?: string[];
}

/** Common Talathi questions shown as clickable chips on the empty screen. */
const SUGGESTED_QUESTIONS: { mr: string; en: string }[] = [
  { mr: "फेरफार नोंदीची प्रक्रिया काय आहे?", en: "What is the ferfar (mutation) process?" },
  { mr: "गाव नमुना ७/१२ म्हणजे काय?", en: "What is Village Form 7/12?" },
  { mr: "वारस नोंद कशी करावी?", en: "How to record inheritance (varas nond)?" },
  { mr: "पीक पाहणी नोंद कधी करायची असते?", en: "When is crop inspection entry done?" },
  { mr: "गाव नमुना ८-अ मध्ये काय असते?", en: "What does Village Form 8-A contain?" },
  { mr: "जमीन मोजणीसाठी अर्ज कसा करावा?", en: "How to apply for land survey?" },
];

/** ChatGPT-style progressive reveal of an incoming answer. */
function StreamedText({ text, onDone }: { text: string; onDone: () => void }) {
  const [count, setCount] = useState(0);
  const words = useRef(text.split(/(\s+)/)); // keep whitespace tokens
  const done = useRef(false);

  useEffect(() => {
    const total = words.current.length;
    const timer = setInterval(() => {
      setCount((c) => {
        const next = Math.min(c + 2, total); // ~2 tokens per tick
        if (next >= total && !done.current) {
          done.current = true;
          clearInterval(timer);
          // let the last words paint before revealing metadata
          setTimeout(onDone, 120);
        }
        return next;
      });
    }, 28);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <RichText text={words.current.slice(0, count).join("")} className="text-[15px]" />
      {count < words.current.length && (
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-primary align-middle" aria-hidden />
      )}
    </div>
  );
}

export function ChatScreen() {
  const { t, lang } = useLang();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [rated, setRated] = useState<Record<string, boolean>>({});
  const toast = useToast();

  const rateAnswer = async (messageId: string, helpful: boolean) => {
    if (rated[messageId] !== undefined) return;
    setRated((r) => ({ ...r, [messageId]: helpful }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message_id: messageId,
      is_helpful: helpful,
    });
    if (error) {
      setRated((r) => {
        const { [messageId]: _removed, ...rest } = r;
        return rest;
      });
      toast(lang === "mr" ? "अभिप्राय जतन झाला नाही" : "Could not save feedback", "error");
    } else {
      toast(
        helpful
          ? lang === "mr" ? "धन्यवाद! अभिप्राय जतन झाला 🙏" : "Thanks! Feedback saved 🙏"
          : lang === "mr" ? "अभिप्राय नोंदवला — आम्ही सुधारणा करू" : "Noted — we'll improve this answer",
        "success"
      );
    }
  };
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceBaseRef = useRef(""); // text already in the box when the mic started

  const speech = useSpeech(lang);

  // Voice transcript is APPENDED to whatever was already typed, so speaking
  // never wipes existing text and a second dictation adds to the first.
  useEffect(() => {
    if (!speech.listening && !speech.transcript) return;
    const base = voiceBaseRef.current;
    setInput(speech.transcript ? (base ? `${base} ${speech.transcript}` : speech.transcript) : base);
  }, [speech.transcript, speech.listening]);

  // Surface a clear reason when the mic fails, instead of silent nothing.
  useEffect(() => {
    if (!speech.error) return;
    const msg: Record<string, { mr: string; en: string }> = {
      "not-allowed": {
        mr: "मायक्रोफोनला परवानगी नाकारली — ब्राउझर सेटिंगमध्ये परवानगी द्या.",
        en: "Microphone permission denied — allow it in your browser settings.",
      },
      "no-speech": { mr: "आवाज ऐकू आला नाही — पुन्हा प्रयत्न करा.", en: "No speech heard — please try again." },
      language: {
        mr: "या भाषेसाठी आवाज ओळख उपलब्ध नाही — इंग्रजीत बोलून पाहा किंवा टाइप करा.",
        en: "Voice not available for this language — try English or type instead.",
      },
      network: { mr: "आवाज सेवेशी संपर्क होत नाही — इंटरनेट तपासा.", en: "Can't reach the voice service — check your connection." },
      unknown: { mr: "आवाज ओळख या ब्राउझरमध्ये चालत नाही (Chrome वापरा).", en: "Voice input isn't supported here — use Chrome." },
    };
    const m = msg[speech.error] ?? msg.unknown;
    toast(lang === "mr" ? m.mr : m.en, "error");
  }, [speech.error, lang, toast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const loadConversation = async (id: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id,role,content,confidence,citations,related_questions")
      .eq("conversation_id", id)
      .order("created_at");
    setConversationId(id);
    setMessages((data ?? []) as UIMessage[]);
    setShowHistory(false);
  };

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      return data as ChatAnswer & { conversationId: string; messageId: string };
    },
    onMutate: (question) => {
      speech.stopListening();
      speech.setTranscript(""); // clear so it doesn't refill the emptied box
      voiceBaseRef.current = "";
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: question }]);
      setInput("");
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      const id = data.messageId ?? crypto.randomUUID();
      setStreamingId(id); // type the answer out ChatGPT-style
      setMessages((m) => [
        ...m,
        {
          id,
          role: "assistant",
          content: data.answer,
          confidence: data.confidence,
          citations: data.citations,
          related_questions: data.related_questions,
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${e.message}` },
      ]);
    },
  });

  const submit = () => {
    const q = input.trim();
    if (q && !ask.isPending) ask.mutate(q);
  };

  const createTicketFrom = (msg: UIMessage, idx: number) => {
    const question = messages[idx - 1]?.content ?? "";
    const params = new URLSearchParams({
      question,
      draft: msg.content.slice(0, 1500),
      confidence: String(msg.confidence ?? 0),
    });
    router.push(`/tickets/new?${params}`);
  };

  const threshold = 60;

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-3xl flex-col">
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { setConversationId(undefined); setMessages([]); }}>
          <Plus className="h-4 w-4" /> {t("newChat")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory((s) => !s)} aria-expanded={showHistory}>
          <History className="h-4 w-4" /> {lang === "mr" ? "इतिहास" : "History"}
        </Button>
      </div>

      {showHistory && (
        <Card className="mb-3 max-h-56 overflow-y-auto p-2">
          {conversations?.map((c) => (
            <button
              key={c.id}
              onClick={() => loadConversation(c.id)}
              className={cn(
                "block w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2",
                c.id === conversationId && "bg-surface-2 font-medium"
              )}
            >
              {c.title}
            </button>
          ))}
          {!conversations?.length && <p className="p-3 text-sm text-muted">—</p>}
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <FileText className="mb-3 h-10 w-10 text-muted" aria-hidden />
            <p className="max-w-sm text-sm text-muted">
              {lang === "mr"
                ? "७/१२, फेरफार, वारस नोंद, पीक पाहणी — शासन निर्णय व परिपत्रकांवर आधारित उत्तरांसाठी प्रश्न विचारा."
                : "Ask about 7/12, ferfar, inheritance, crop entry — answers grounded in GRs and circulars."}
            </p>
            <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q.en}
                  onClick={() => ask.mutate(lang === "mr" ? q.mr : q.en)}
                  disabled={ask.isPending}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-2 hover:shadow-sm active:scale-95"
                >
                  {lang === "mr" ? q.mr : q.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                m.role === "user"
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-2"
              )}
            >
              {m.role === "assistant" ? (
                m.id === streamingId ? (
                  <StreamedText
                    text={m.content}
                    onDone={() => {
                      setStreamingId(null);
                      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                ) : (
                  <RichText text={m.content} className="text-[15px]" />
                )
              ) : (
                <p className="whitespace-pre-wrap text-[15px]">{m.content}</p>
              )}

              {m.role === "assistant" && m.confidence !== undefined && m.id !== streamingId && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={m.confidence >= threshold ? "success" : "danger"}>
                      {t("confidence")}: {m.confidence}%
                    </Badge>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => navigator.clipboard.writeText(m.content)}
                      aria-label={t("copy")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <span className="mx-1 h-4 w-px bg-border" aria-hidden />
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => rateAnswer(m.id, true)}
                      aria-label={lang === "mr" ? "उपयुक्त" : "Helpful"}
                      aria-pressed={rated[m.id] === true}
                      className={cn(rated[m.id] === true && "text-success")}
                      disabled={rated[m.id] !== undefined}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => rateAnswer(m.id, false)}
                      aria-label={lang === "mr" ? "उपयुक्त नाही" : "Not helpful"}
                      aria-pressed={rated[m.id] === false}
                      className={cn(rated[m.id] === false && "text-danger")}
                      disabled={rated[m.id] !== undefined}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {!!m.citations?.length && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-muted">{t("sources")}:</p>
                      <ul className="space-y-1">
                        {m.citations.map((c, i) => (
                          <li key={i} className="rounded-lg bg-surface p-2 text-xs">
                            <span className="font-medium">📄 {c.title}</span>
                            <span className="text-muted">
                              {c.gr_number && ` · GR ${c.gr_number}`}
                              {c.circular_number && ` · ${lang === "mr" ? "परिपत्रक" : "Circular"} ${c.circular_number}`}
                              {c.page_number && ` · ${lang === "mr" ? "पृष्ठ" : "Page"} ${c.page_number}`}
                              {c.issued_date && ` · ${c.issued_date}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.confidence < threshold ? (
                    <div className="rounded-lg bg-accent-soft p-3">
                      <p className="mb-2 flex items-start gap-2 text-xs">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                        {t("lowConfidence")}
                      </p>
                      <Button variant="accent" size="sm" onClick={() => createTicketFrom(m, idx)}>
                        {t("createTicket")}
                      </Button>
                    </div>
                  ) : (
                    /* Even a confident answer may not satisfy the Talathi —
                       they can always escalate to an officer via a ticket. */
                    <button
                      onClick={() => createTicketFrom(m, idx)}
                      className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
                    >
                      {t("notSatisfied")}
                    </button>
                  )}

                  {!!m.related_questions?.length && (
                    <div className="flex flex-wrap gap-2">
                      {m.related_questions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => ask.mutate(q)}
                          className="rounded-full border border-border px-3 py-1 text-xs hover:bg-surface"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-muted">{t("disclaimer")}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {ask.isPending && (
          <div className="flex justify-start">
            <div className="space-y-2 rounded-2xl bg-surface-2 px-4 py-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="mt-3 flex items-end gap-2">
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            speech.transcribing
              ? (lang === "mr" ? "आवाज मजकुरात रूपांतरित करत आहे…" : "Transcribing your voice…")
              : speech.listening
                ? (lang === "mr"
                    ? "🎙️ ऐकत आहे… बोलणे थांबवताच आपोआप थांबेल"
                    : "🎙️ Listening… stops automatically when you pause")
                : t("askPlaceholder")
          }
          aria-label={t("askPlaceholder")}
          className={cn((speech.listening || speech.transcribing) && "border-accent")}
        />
        {speech.supported.stt && (
          <Button
            variant={speech.listening ? "accent" : "outline"}
            size="icon"
            disabled={speech.transcribing}
            onClick={() => {
              if (speech.listening) {
                speech.stopListening();
              } else {
                // remember existing text so dictation appends to it
                voiceBaseRef.current = input.trim();
                speech.startListening();
              }
            }}
            aria-label={speech.listening ? "Stop microphone" : "Start microphone"}
            aria-pressed={speech.listening}
          >
            {speech.transcribing ? (
              <Spinner />
            ) : speech.listening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}
        <Button size="icon" onClick={submit} disabled={ask.isPending || !input.trim()} aria-label={t("send")}>
          {ask.isPending ? <Spinner /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
