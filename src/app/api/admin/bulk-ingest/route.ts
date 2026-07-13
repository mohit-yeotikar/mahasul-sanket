// Super-admin bulk document ingestion. The client uploads files one at a time;
// for each file this route: extracts text → detects duplicates → auto-assigns
// title/description/category via AI → indexes (chunk + embed) → auto-approves.
//
// Works WITH or WITHOUT migration 0010: it probes for the content_hash/category
// columns. If present, it uses exact-content dedup + a category column; if not,
// it falls back to GR-number/title dedup and stores the category as a tag.

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ingestDocumentText } from "@/lib/ai/ingest";
import { extractText, isSupportedFile, fileExtension } from "@/lib/ai/extract";
import { autoCatalog } from "@/lib/ai/catalog";
import { geminiOcr } from "@/lib/ai/ocr";

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "tif"];
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";

export const runtime = "nodejs";
export const maxDuration = 300;

const ROLES = ["super_admin", "state_admin"];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ status: "failed", name: file.name, error: "File too large (max 20 MB)" });
  }
  const ext = fileExtension(file.name);
  const isImage = IMAGE_EXT.includes(ext);
  if (!isSupportedFile(file.name) && !isImage) {
    return NextResponse.json({
      status: "failed", name: file.name,
      error: "Unsupported type (PDF, Word, Markdown, TXT, CSV/TSV, HTML, or a scanned image).",
    });
  }

  const admin = createAdminClient();

  try {
    // 0. Probe for migration-0010 columns so we can degrade gracefully.
    const { error: probeErr } = await admin.from("documents").select("content_hash").limit(1);
    const hasNewCols = !probeErr;

    // 1. Extract text — with Gemini vision OCR fallback for scanned PDFs & images
    let pages: { text: string; page: number | null }[];
    let ocrUsed = false;
    if (isImage) {
      const ocr = await geminiOcr(await file.arrayBuffer(), file.type || `image/${ext}`);
      pages = [{ text: ocr, page: null }];
      ocrUsed = true;
    } else {
      pages = await extractText(file);
      const extracted = pages.map((p) => p.text).join("\n").trim();
      if (extracted.length < 50 && ext === "pdf") {
        const ocr = await geminiOcr(await file.arrayBuffer(), "application/pdf");
        if (ocr.trim().length >= 50) { pages = [{ text: ocr, page: null }]; ocrUsed = true; }
      }
    }
    const fullText = pages.map((p) => p.text).join("\n").trim();
    if (fullText.length < 50) {
      return NextResponse.json({
        status: "failed", name: file.name,
        error: ocrUsed
          ? "OCR could not read this document — the scan may be too low-quality."
          : "No readable text (scanned document with no OCR match).",
      });
    }

    // 2. Duplicate detection — exact content hash (only if the column exists)
    const hash = createHash("sha256").update(norm(fullText)).digest("hex");
    if (hasNewCols) {
      const { data: dup } = await admin
        .from("documents").select("id,title").eq("content_hash", hash).neq("status", "rejected").limit(1).maybeSingle();
      if (dup) {
        return NextResponse.json({
          status: "duplicate", name: file.name, title: dup.title, duplicateOf: dup.id, reason: "identical content",
        });
      }
    }

    // 3. AI catalogue: title, summary, doc type, category, GR number, date, tags
    const meta = await autoCatalog(fullText, file.name.replace(/\.[^.]+$/, ""));

    // Duplicate by GR number (works on any schema)
    if (meta.grNumber) {
      const { data: grDup } = await admin
        .from("documents").select("id,title").eq("gr_number", meta.grNumber).neq("status", "rejected").limit(1).maybeSingle();
      if (grDup) {
        return NextResponse.json({
          status: "duplicate", name: file.name, title: grDup.title, duplicateOf: grDup.id,
          reason: `GR ${meta.grNumber} already exists`,
        });
      }
    }
    // Fallback dedup by exact title when there's no GR number
    if (!meta.grNumber) {
      const { data: titleDups } = await admin
        .from("documents").select("id,title").eq("title", meta.title).neq("status", "rejected").limit(1);
      if (titleDups?.length) {
        return NextResponse.json({
          status: "duplicate", name: file.name, title: meta.title, duplicateOf: titleDups[0].id,
          reason: "same title already exists",
        });
      }
    }

    // 4. Store the original file
    const filePath = `documents/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await admin.storage
      .from("knowledge").upload(filePath, await file.arrayBuffer(), { contentType: file.type });
    if (upErr) {
      return NextResponse.json({ status: "failed", name: file.name, error: "Storage upload failed" });
    }

    // 5. Create the document record with AI metadata
    const catLabel = CATEGORY_LABELS[meta.category]?.mr ?? meta.category;
    const record: Record<string, unknown> = {
      title: meta.title,
      title_mr: meta.title_mr,
      doc_type: meta.docType,
      gr_number: meta.grNumber,
      circular_number: meta.circularNumber,
      department: meta.department,
      issued_date: meta.issuedDate,
      summary: meta.summary || null,
      file_path: filePath,
      file_mime: file.type || null,
      file_size: file.size,
      status: "processing",
      uploaded_by: user.id,
    };
    if (hasNewCols) {
      record.content_hash = hash;
      record.category = meta.category;
      record.tags = meta.tags;
    } else {
      // No category column — keep it visible/searchable as a tag.
      record.tags = [catLabel, ...meta.tags];
    }

    const { data: doc, error: docErr } = await admin.from("documents").insert(record).select("id").single();
    if (docErr || !doc) {
      return NextResponse.json({ status: "failed", name: file.name, error: docErr?.message ?? "Could not create document record" });
    }

    // 6. Chunk + embed + store, then auto-approve (super admin is the authority)
    const { chunks } = await ingestDocumentText(doc.id, pages);
    await admin.from("documents").update({ status: "approved", approved_by: user.id }).eq("id", doc.id);

    await admin.from("audit_logs").insert({
      actor_id: user.id, action: "document.bulk_ingested", entity: "documents", entity_id: doc.id,
      detail: { title: meta.title, category: meta.category, chunks },
    });

    return NextResponse.json({
      status: "indexed", name: file.name, documentId: doc.id,
      title: meta.title, category: meta.category, docType: meta.docType, grNumber: meta.grNumber, chunks,
    });
  } catch (e) {
    return NextResponse.json({
      status: "failed", name: file.name, error: e instanceof Error ? e.message : "Processing failed",
    });
  }
}
