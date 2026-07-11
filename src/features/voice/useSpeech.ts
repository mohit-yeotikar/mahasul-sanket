"use client";

// Voice INPUT only, via the browser's Web Speech API (free, no server).
// Speech OUTPUT (read-aloud) was removed: it needed a Python TTS service that
// can't run on Vercel. Dictation stays; Marathi falls back mr-IN -> hi-IN.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/dictionaries";

const SPEECH_LANG: Record<Lang | "hi", string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

export type SpeechError =
  | "not-allowed"      // mic permission denied
  | "no-speech"        // nothing heard
  | "language"         // language not supported
  | "network"          // recognition service unreachable
  | "unknown"
  | null;

export function useSpeech(lang: Lang) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<SpeechError>(null);
  const [supported, setSupported] = useState({ stt: false });

  const recRef = useRef<SR | null>(null);
  const finalRef = useRef("");            // committed (final) text this session
  const triedFallbackRef = useRef(false); // mr-IN -> hi-IN one-time fallback
  const wantListeningRef = useRef(false); // user intends to keep listening

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    setSupported({ stt: !!(w.SpeechRecognition || w.webkitSpeechRecognition) });
  }, []);

  const buildRecognizer = useCallback(function createRecognizer(recLang: string) {
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = recLang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SR) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += chunk + " ";
        else interim += chunk;
      }
      setTranscript((finalRef.current + interim).replace(/\s+/g, " ").trimStart());
    };

    rec.onerror = (ev: SR) => {
      const code = ev?.error as string;
      // Marathi recognition is not available in every Chrome build. Try Hindi
      // once because it is Devanagari-friendly and usually available.
      if (code === "language-not-supported" && lang === "mr" && !triedFallbackRef.current) {
        triedFallbackRef.current = true;
        wantListeningRef.current = false;
        try { rec.stop(); } catch {}
        const fb = createRecognizer("hi-IN");
        if (fb) {
          recRef.current = fb;
          wantListeningRef.current = true;
          try { fb.start(); return; } catch {}
        }
      }
      if (code === "no-speech") setError("no-speech");
      else if (code === "not-allowed" || code === "service-not-allowed") setError("not-allowed");
      else if (code === "language-not-supported") setError("language");
      else if (code === "network") setError("network");
      else if (code === "aborted") { /* user stopped; not an error */ }
      else setError("unknown");
      wantListeningRef.current = false;
      setListening(false);
    };

    rec.onend = () => {
      // Chrome auto-stops after a pause; restart if the user still wants to talk.
      if (recRef.current === rec && wantListeningRef.current) {
        try { rec.start(); return; } catch {}
      }
      setListening(false);
    };

    return rec;
  }, [lang]);

  const startListening = useCallback(() => {
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    if (!(w.SpeechRecognition || w.webkitSpeechRecognition)) {
      setError("unknown");
      return;
    }
    setError(null);
    finalRef.current = "";
    triedFallbackRef.current = false;
    setTranscript("");
    const rec = buildRecognizer(SPEECH_LANG[lang]);
    if (!rec) return;
    recRef.current = rec;
    wantListeningRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(true);
    }
  }, [lang, buildRecognizer]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  useEffect(() => () => {
    wantListeningRef.current = false;
    try { recRef.current?.stop(); } catch {}
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    setTranscript,
    startListening,
    stopListening,
  };
}
