import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ingestDocumentText } from "@/lib/ai/ingest";
import { extractText, isSupportedFile } from "@/lib/ai/extract";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300; // ingestion can be slow on free tiers

const UPLOAD_ROLES = ["dco", "district_admin", "state_admin", "super_admin"];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const metaSchema = z.object({
  title: z.string().min(3).max(300),
  docType: z.enum(["gr", "circular", "faq", "sop", "notification", "manual", "other"]),
  grNumber: z.string().max(100).optional(),
  circularNumber: z.string().max(100).optional(),
  department: z.string().max(200).optional(),
  issuedDate: z.string().optional(),
  tags: z.string().optional(), // comma separated
  // ocrText: client-side Tesseract result for scanned images
  ocrText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !UPLOAD_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!rateLimit(`ingest:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const parsed = metaSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  const meta = parsed.data;

  if (!file && !meta.ocrText) {
    return NextResponse.json({ error: "Provide a file or extracted text" }, { status: 400 });
  }
  if (file) {
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
    if (!isSupportedFile(file.name) && !meta.ocrText) {
      return NextResponse.json(
        { error: "Supported: PDF, Word (.docx), Markdown (.md), TXT, CSV/TSV, HTML, JSON — for scanned images use the OCR option" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  // 1. Store the original file (private bucket, served via signed URLs)
  let filePath: string | null = null;
  if (file) {
    filePath = `documents/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await admin.storage
      .from("knowledge")
      .upload(filePath, await file.arrayBuffer(), { contentType: file.type });
    if (upErr) return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  // 2. Create the document record
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .insert({
      title: meta.title,
      doc_type: meta.docType,
      gr_number: meta.grNumber || null,
      circular_number: meta.circularNumber || null,
      department: meta.department || null,
      issued_date: meta.issuedDate || null,
      tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      file_path: filePath,
      file_mime: file?.type ?? null,
      file_size: file?.size ?? null,
      status: "processing",
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (docErr || !doc) return NextResponse.json({ error: "Could not create document" }, { status: 500 });

  // 3. Extract text: browser-OCR result, or by file type (PDF, DOCX, MD, CSV, HTML, TXT, JSON)
  try {
    const pages = meta.ocrText
      ? [{ text: meta.ocrText, page: null }]
      : await extractText(file!);

    const totalText = pages.map((p) => p.text).join("").trim();
    if (totalText.length < 50) {
      await admin.from("documents").update({ status: "rejected", summary: "No readable text found — scanned document? Use OCR upload." }).eq("id", doc.id);
      return NextResponse.json(
        { error: "No readable text found. If this is a scanned document, use the OCR option." },
        { status: 422 }
      );
    }

    // 4. Chunk + embed + store (embeddings degrade gracefully if unavailable)
    const { chunks, embedded } = await ingestDocumentText(doc.id, pages);

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "document.uploaded",
      entity: "documents",
      entity_id: doc.id,
      detail: { title: meta.title, chunks, embedded },
    });

    return NextResponse.json({ ok: true, documentId: doc.id, chunks, embedded });
  } catch (e) {
    await admin.from("documents").update({ status: "rejected", summary: "Processing failed" }).eq("id", doc.id);
    return NextResponse.json(
      { error: `Processing failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }
}
