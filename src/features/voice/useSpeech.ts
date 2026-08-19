"use client";

// Voice INPUT (dictation). Marathi = "live Whisper": one continuous recording is
// re-transcribed through Groq's Whisper every ~2.5s, so accurate Marathi text
// appears and grows AS YOU SPEAK, with a final pass on stop. English uses the
// browser recognizer (already real-time + accurate). No speech OUTPUT.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/dictionaries";

const SPEECH_LANG: Record<Lang | "hi", string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
};

const STT_ENDPOINT = "/api/voice/stt";      // Groq Whisper (server route)
const LIVE_INTERVAL_MS = 2500;              // how often to re-transcribe while speaking
const SILENCE_MS = 1500;                    // auto-stop this long after speech goes quiet
const SPEECH_RMS = 0.025;                   // loudness above this counts as speaking

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
  const [transcribing, setTranscribing] = useState(false); // final Whisper pass
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<SpeechError>(null);
  const [supported, setSupported] = useState({ stt: false });

  // Browser recognizer (English).
  const recRef = useRef<SR | null>(null);
  const finalRef = useRef("");
  const triedFallbackRef = useRef(false);
  const wantListeningRef = useRef(false);

  // Live Whisper recording (Marathi).
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingRef = useRef(false);
  const sttRunRef = useRef(0);              // cancels stale dictations/requests
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);        // one live request at a time
  const lastSizeRef = useRef(0);            // only apply results from ever-longer audio

  // Voice-activity detection — auto-stop when the user stops speaking.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<() => void>(() => {});

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    const hasRec = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const hasMedia = typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setSupported({ stt: hasRec || hasMedia });
  }, []);

  // ── browser recognizer (English) ──
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
      if (code === "no-speech") setError("no-speech");
      else if (code === "not-allowed" || code === "service-not-allowed") setError("not-allowed");
      else if (code === "language-not-supported") setError("language");
      else if (code === "network") setError("network");
      else if (code === "aborted") { /* user stopped */ }
      else setError("unknown");
    };

    rec.onend = () => {
      if (recRef.current === rec && wantListeningRef.current) {
        try { rec.start(); return; } catch {}
      }
      setListening(false);
    };

    return rec;
  }, []);

  // ── live Whisper (Marathi) ──
  const stopTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  const clearLiveTimer = useCallback(() => {
    if (liveTimerRef.current) { clearInterval(liveTimerRef.current); liveTimerRef.current = null; }
  }, []);

  const clearVad = useCallback(() => {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null; }
    try { audioCtxRef.current?.close(); } catch { /* already closed */ }
    audioCtxRef.current = null;
  }, []);

  const transcribeBlob = useCallback(async (blob: Blob, langCode: string): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("audio", blob, "speech.webm");
      fd.append("lang", langCode);
      const res = await fetch(STT_ENDPOINT, { method: "POST", body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return String(data?.text ?? "").trim();
    } catch {
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("unknown"); setListening(false); return;
    }
    const runId = sttRunRef.current;                      // set by startListening
    const langCode = SPEECH_LANG[lang].split("-")[0];     // mr | en
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (sttRunRef.current !== runId) { stream.getTracks().forEach((t) => t.stop()); return; }
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find(
        (m) => MediaRecorder.isTypeSupported?.(m)
      );
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data?.size) mediaChunksRef.current.push(e.data); };
      mediaRecRef.current = mr;
      recordingRef.current = true;
      mr.start(1000); // 1s timeslice — chunks accumulate; chunks[0..n] stays valid webm

      // Voice-activity detection: once the user has spoken and then gone quiet
      // for ~SILENCE_MS, auto-stop so they don't have to tap the mic off.
      try {
        const Ctx = window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new Ctx();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const startedAt = Date.now();
        let lastLoud = Date.now();
        let sawSpeech = false;
        vadTimerRef.current = setInterval(() => {
          if (sttRunRef.current !== runId) return;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / buf.length);
          const now = Date.now();
          if (rms > SPEECH_RMS) { lastLoud = now; sawSpeech = true; }
          else if (sawSpeech && now - lastLoud > SILENCE_MS && now - startedAt > 1200) {
            clearVad();
            autoStopRef.current();   // = stopListening → final transcription pass
          }
        }, 150);
      } catch { /* AudioContext unavailable — manual mic-off still works */ }

      // Live pass: re-transcribe the audio-so-far every LIVE_INTERVAL_MS.
      inFlightRef.current = false;
      liveTimerRef.current = setInterval(async () => {
        if (inFlightRef.current || sttRunRef.current !== runId) return;
        const chunks = mediaChunksRef.current;
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 4000) return; // too little audio to be worth a call yet
        const size = blob.size;
        inFlightRef.current = true;
        const text = await transcribeBlob(blob, langCode);
        inFlightRef.current = false;
        // Ignore a response that finished out of order (older/shorter audio).
        if (text && sttRunRef.current === runId && size >= lastSizeRef.current) {
          lastSizeRef.current = size;
          setTranscript(text);
        }
      }, LIVE_INTERVAL_MS);
    } catch {
      recordingRef.current = false;
      clearLiveTimer();
      clearVad();
      stopTracks();
      setError("not-allowed");
      setListening(false);
    }
  }, [lang, transcribeBlob, stopTracks, clearLiveTimer, clearVad]);

  // Stop recording; do a final, most-accurate pass over the whole clip.
  const finishRecordingAndTranscribe = useCallback(() => {
    clearLiveTimer();
    clearVad();
    const mr = mediaRecRef.current;
    mediaRecRef.current = null;
    if (!mr || !recordingRef.current) { recordingRef.current = false; stopTracks(); return; }
    recordingRef.current = false;
    const runId = sttRunRef.current;
    const langCode = SPEECH_LANG[lang].split("-")[0];

    mr.onstop = async () => {
      stopTracks();
      const chunks = mediaChunksRef.current;
      mediaChunksRef.current = [];
      const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
      if (blob.size < 1200) return; // effectively silence
      const size = blob.size;
      setTranscribing(true);
      const text = await transcribeBlob(blob, langCode);
      // Final clip is the longest, so it wins over any late live response.
      if (text && sttRunRef.current === runId && size >= lastSizeRef.current) {
        lastSizeRef.current = size;
        finalRef.current = text + " ";
        setTranscript(text);
      }
      if (sttRunRef.current === runId) setTranscribing(false);
    };
    try { mr.stop(); } catch { stopTracks(); }
  }, [lang, transcribeBlob, stopTracks, clearLiveTimer, clearVad]);

  const startListening = useCallback(() => {
    setError(null);
    finalRef.current = "";
    triedFallbackRef.current = false;
    sttRunRef.current += 1;
    lastSizeRef.current = 0;
    inFlightRef.current = false;
    clearLiveTimer();
    clearVad();
    setTranscribing(false);
    setTranscript("");

    if (lang === "mr") {
      // Marathi: live Whisper (accurate + grows as you speak).
      void startRecording();
      setListening(true);
      return;
    }

    // English: browser recognizer (real-time + accurate).
    const rec = buildRecognizer(SPEECH_LANG[lang]);
    if (!rec) { setError("unknown"); return; }
    recRef.current = rec;
    wantListeningRef.current = true;
    try { rec.start(); setListening(true); } catch { setListening(true); }
  }, [lang, buildRecognizer, startRecording, clearLiveTimer, clearVad]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    finishRecordingAndTranscribe();
  }, [finishRecordingAndTranscribe]);

  // The VAD loop calls autoStopRef.current(); keep it pointed at the latest
  // stopListening so it triggers a real stop without a dependency cycle.
  useEffect(() => { autoStopRef.current = stopListening; }, [stopListening]);

  useEffect(() => () => {
    wantListeningRef.current = false;
    recordingRef.current = false;
    sttRunRef.current += 1;
    clearLiveTimer();
    clearVad();
    try { recRef.current?.stop(); } catch {}
    try { mediaRecRef.current?.stop(); } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, [clearLiveTimer, clearVad]);

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
