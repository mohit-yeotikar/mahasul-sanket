"use client";

// Voice INPUT (dictation). Marathi uses Groq's hosted Whisper (large-v3) for
// accuracy, with the browser's Web Speech API running alongside for an instant
// live preview AND as a fallback if Whisper is unavailable. English uses Web
// Speech only (already good, and instant). No speech OUTPUT / read-aloud.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/dictionaries";

const SPEECH_LANG: Record<Lang | "hi", string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
};

// Groq Whisper transcription (server route). Used for Marathi.
const STT_ENDPOINT = "/api/voice/stt";

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
  const [transcribing, setTranscribing] = useState(false); // Whisper in progress
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<SpeechError>(null);
  const [supported, setSupported] = useState({ stt: false });

  const recRef = useRef<SR | null>(null);
  const finalRef = useRef("");            // committed (final) browser text this session
  const triedFallbackRef = useRef(false); // mr-IN -> hi-IN one-time fallback
  const wantListeningRef = useRef(false);  // user intends to keep listening

  // Recording for Whisper (Marathi).
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingRef = useRef(false);
  const sttRunRef = useRef(0);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    // stt is "supported" if EITHER the browser recognizer OR mic recording works.
    const hasRec = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const hasMedia = typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setSupported({ stt: hasRec || hasMedia });
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
      // These are non-fatal when Whisper is also recording — don't surface them.
      if (code === "no-speech" && recordingRef.current) { return; }
      if (code === "not-allowed" || code === "service-not-allowed") setError("not-allowed");
      else if (code === "no-speech") setError("no-speech");
      else if (code === "language-not-supported") setError("language");
      else if (code === "network") setError("network");
      else if (code === "aborted") { /* user stopped; not an error */ }
      else setError("unknown");
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

  const stopTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  // Record audio for Whisper, alongside the browser recognizer.
  const startRecording = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find(
        (m) => MediaRecorder.isTypeSupported?.(m)
      );
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data?.size) mediaChunksRef.current.push(e.data); };
      mediaRecRef.current = mr;
      recordingRef.current = true;
      mr.start();
    } catch {
      recordingRef.current = false;
      stopTracks();
    }
  }, [stopTracks]);

  // Stop recording and send to Whisper; replace the browser preview with the
  // more accurate transcript. Keep the preview if Whisper fails.
  const finishRecordingAndTranscribe = useCallback(() => {
    const mr = mediaRecRef.current;
    mediaRecRef.current = null;
    if (!mr || !recordingRef.current) { recordingRef.current = false; stopTracks(); return; }
    recordingRef.current = false;
    const runId = sttRunRef.current + 1;
    sttRunRef.current = runId;

    mr.onstop = async () => {
      stopTracks();
      const chunks = mediaChunksRef.current;
      mediaChunksRef.current = [];
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
      if (blob.size < 1200) return; // effectively silence
      setTranscribing(true);
      try {
        const fd = new FormData();
        fd.append("audio", blob, "speech.webm");
        fd.append("lang", SPEECH_LANG[lang].split("-")[0]); // mr | hi | en
        const res = await fetch(STT_ENDPOINT, { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          const text = String(data?.text ?? "").trim();
          if (text && sttRunRef.current === runId) {
            finalRef.current = text + " ";
            setTranscript(text);
          }
        }
      } catch {
        /* keep the browser-recognized text */
      } finally {
        if (sttRunRef.current === runId) setTranscribing(false);
      }
    };
    try { mr.stop(); } catch { stopTracks(); }
  }, [lang, stopTracks]);

  const startListening = useCallback(() => {
    setError(null);
    finalRef.current = "";
    triedFallbackRef.current = false;
    sttRunRef.current += 1;   // cancel any in-flight transcription
    setTranscribing(false);
    setTranscript("");

    // Marathi: record for Whisper (accurate). Browser recognizer runs too, for
    // a live preview + as fallback. English: browser recognizer only.
    if (lang === "mr") void startRecording();

    const rec = buildRecognizer(SPEECH_LANG[lang]);
    if (rec) {
      recRef.current = rec;
      wantListeningRef.current = true;
      try { rec.start(); } catch {}
    }

    // "Listening" is true if either capture path is active.
    if (rec || recordingRef.current) setListening(true);
    else setError("unknown");
  }, [lang, buildRecognizer, startRecording]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    finishRecordingAndTranscribe();
  }, [finishRecordingAndTranscribe]);

  useEffect(() => () => {
    wantListeningRef.current = false;
    recordingRef.current = false;
    sttRunRef.current += 1;
    try { recRef.current?.stop(); } catch {}
    try { mediaRecRef.current?.stop(); } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return {
    supported,
    listening,
    transcribing,
    transcript,
    error,
    setTranscript,
    startListening,
    stopListening,
  };
}
