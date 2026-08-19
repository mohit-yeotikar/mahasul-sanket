"use client";

// Homepage chatbox — lets any citizen ask the AI without logging in.
// Text + Marathi voice. Renders the answer inline with confidence + sources.

import { useEffect, useRef, useState } from "react";
import { Send, Mic, MicOff, FileText, TriangleAlert } from "lucide-react";
import { Badge, Button, Spinner, Textarea } from "@/components/ui";
import { RichText } from "@/components/ui/RichText";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useSpeech } from "@/features/voice/useSpeech";
import type { ChatAnswer } from "@/types";

const SUGGESTED = [
  { mr: "फेरफार नोंदीची प्रक्रिया काय आहे?", en: "What is the ferfar (mutation) process?" },
  { mr: "७/१२ उतारा कसा मिळवायचा?", en: "How do I get a 7/12 extract?" },
  { mr: "वारस नोंद कशी करावी?", en: "How to record inheritance (varas)?" },
  { mr: "ई-पीक पाहणी कशी करायची?", en: "How to do e-Peek Pahani?" },
];

export function PublicChat() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>();
  const speech = useSpeech(lang);
  const voiceBaseRef = useRef("");

  useEffect(() => {
    if (!speech.listening && !speech.transcript) return;
    const base = voiceBaseRef.current;
    setInput(speech.transcript ? (base ? `${base} ${speech.transcript}` : speech.transcript) : base);
  }, [speech.transcript, speech.listening]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || loading) return;
    speech.stopListening();
    speech.setTranscript("");
    voiceBaseRef.current = "";
    setLoading(true);
    setErr(undefined);
    setAnswer(null);
    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setInput("");
      setAnswer(data as ChatAnswer);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-left">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-xl shadow-primary/5">
        <Textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
          }}
          placeholder={
            speech.listening
              ? (M ? "🎙️ ऐकत आहे… बोलणे थांबवताच थांबेल" : "🎙️ Listening… stops when you pause")
              : (M ? "तुमचा प्रश्न विचारा… (उदा. फेरफार नोंदीची प्रक्रिया)" : "Ask your question… (e.g. the ferfar process)")
          }
          className="min-h-[2.75rem] flex-1 resize-none self-center border-0 bg-transparent px-2 shadow-none focus-visible:outline-none"
        />
        {speech.supported.stt && (
          <Button
            variant={speech.listening ? "accent" : "ghost"}
            size="icon"
            disabled={speech.transcribing}
            onClick={() => {
              if (speech.listening) speech.stopListening();
              else { voiceBaseRef.current = input.trim(); speech.startListening(); }
            }}
            aria-label={speech.listening ? "Stop microphone" : "Start microphone"}
          >
            {speech.transcribing ? <Spinner /> : speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
        <Button size="icon" onClick={() => ask(input)} disabled={loading || !input.trim()} aria-label="Send">
          {loading ? <Spinner /> : <Send className="h-5 w-5" />}
        </Button>
      </div>

      {!answer && !loading && !err && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s.en}
              onClick={() => ask(M ? s.mr : s.en)}
              className="rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-sm text-muted transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-sm"
            >
              {M ? s.mr : s.en}
            </button>
          ))}
        </div>
      )}

      {(loading || answer || err) && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Spinner className="h-4 w-4" /> {M ? "उत्तर तयार करत आहे…" : "Thinking…"}
            </p>
          )}
          {err && <p className="text-sm text-danger">⚠️ {err}</p>}
          {answer && (
            <>
              <RichText text={answer.answer} className="text-[15px]" />
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Badge tone={answer.confidence >= 60 ? "success" : "warning"}>
                  {M ? "विश्वास" : "Confidence"}: {answer.confidence}%
                </Badge>
                {answer.citations?.slice(0, 3).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs text-muted">
                    <FileText className="h-3 w-3" aria-hidden />
                    {c.title.length > 42 ? c.title.slice(0, 42) + "…" : c.title}
                    {c.gr_number ? ` · GR ${c.gr_number}` : ""}
                  </span>
                ))}
              </div>
              {!!answer.related_questions?.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {answer.related_questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => ask(q)}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:bg-surface-2"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
                <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                {M
                  ? "हे AI उत्तर मार्गदर्शनासाठी आहे. अधिकृत निर्णयासाठी मूळ शासन निर्णय पहा किंवा तलाठी/तहसील कार्यालयाशी संपर्क साधा."
                  : "AI guidance only — verify with the official GR or your Talathi/Tahsil office."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
