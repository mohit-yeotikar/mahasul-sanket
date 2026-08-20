"use client";

// Upload GR/circular → server extracts text (PDF) or uses browser OCR
// (Tesseract, Marathi+English) for scanned images → chunk → embed → AI.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button, Card, Field, Input, Select, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

export function UploadDocumentForm() {
  const { lang, t } = useLang();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>();
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [meta, setMeta] = useState({
    title: "", docType: "gr", grNumber: "", circularNumber: "",
    department: "", issuedDate: "", tags: "",
  });

  const isImage = file?.type.startsWith("image/");

  const submit = async () => {
    if (!file || !meta.title) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const form = new FormData();
      Object.entries(meta).forEach(([k, v]) => v && form.append(k, v));

      if (isImage) {
        // Scanned document: OCR in the browser (free) with Marathi + English
        const { default: Tesseract } = await import("tesseract.js");
        const result = await Tesseract.recognize(file, "mar+eng", {
          logger: (m) => {
            if (m.status === "recognizing text") setOcrProgress(Math.round(m.progress * 100));
          },
        });
        form.append("ocrText", result.data.text);
        setOcrProgress(undefined);
      }
      form.append("file", file);

      const res = await fetch("/api/ingest", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // When embeddings are unavailable, the doc is still stored + keyword-
      // searchable — surface that instead of silently degrading.
      const keywordOnly = typeof data.embedded === "number" && data.embedded < data.chunks;
      setMessage({
        ok: true,
        text: lang === "mr"
          ? `यशस्वी! ${data.chunks} भाग तयार झाले. मंजुरीनंतर AI ला उपलब्ध होईल.${
              keywordOnly ? " (एम्बेडिंग सध्या उपलब्ध नाही — कीवर्ड शोध कार्यरत; GEMINI_API_KEY तपासा.)" : ""
            }`
          : `Done! ${data.chunks} chunks created. Available to AI after approval.${
              keywordOnly ? " (Embeddings unavailable — keyword search works; check GEMINI_API_KEY.)" : ""
            }`,
      });
      setFile(null);
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={lang === "mr" ? "शीर्षक" : "Title"} required>
          <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        </Field>
        <Field label={t("category")} required>
          <Select value={meta.docType} onChange={(e) => setMeta({ ...meta, docType: e.target.value })}>
            <option value="gr">GR / शासन निर्णय</option>
            <option value="circular">परिपत्रक / Circular</option>
            <option value="faq">FAQ</option>
            <option value="sop">SOP / कार्यपद्धती</option>
            <option value="notification">अधिसूचना</option>
            <option value="manual">नियमपुस्तिका</option>
            <option value="other">इतर</option>
          </Select>
        </Field>
        <Field label="GR क्रमांक">
          <Input value={meta.grNumber} onChange={(e) => setMeta({ ...meta, grNumber: e.target.value })} />
        </Field>
        <Field label={lang === "mr" ? "परिपत्रक क्रमांक" : "Circular no."}>
          <Input value={meta.circularNumber} onChange={(e) => setMeta({ ...meta, circularNumber: e.target.value })} />
        </Field>
        <Field label={lang === "mr" ? "विभाग" : "Department"}>
          <Input value={meta.department} onChange={(e) => setMeta({ ...meta, department: e.target.value })} />
        </Field>
        <Field label={lang === "mr" ? "दिनांक" : "Issued date"}>
          <Input type="date" value={meta.issuedDate} onChange={(e) => setMeta({ ...meta, issuedDate: e.target.value })} />
        </Field>
      </div>
      <Field label={lang === "mr" ? "टॅग (स्वल्पविरामाने)" : "Tags (comma separated)"}>
        <Input value={meta.tags} onChange={(e) => setMeta({ ...meta, tags: e.target.value })} placeholder="फेरफार, ७/१२" />
      </Field>
      <Field
        label={lang === "mr"
          ? "फाईल (PDF / Word / Markdown / TXT / CSV / HTML / स्कॅन प्रतिमा)"
          : "File (PDF / Word / Markdown / TXT / CSV / HTML / scanned image)"}
        required
      >
        <Input
          type="file"
          accept=".pdf,.docx,.md,.markdown,.txt,.csv,.tsv,.html,.htm,.json,.log,image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="pt-2"
        />
      </Field>

      {ocrProgress !== undefined && (
        <p className="text-sm text-muted">OCR: {ocrProgress}%…</p>
      )}
      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {message.text}
        </p>
      )}

      <Button disabled={busy || !file || !meta.title} onClick={submit}>
        {busy ? <Spinner /> : <><Upload className="h-4 w-4" /> {t("upload")}</>}
      </Button>
    </Card>
  );
}
