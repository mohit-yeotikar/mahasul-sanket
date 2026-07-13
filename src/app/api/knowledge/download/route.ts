// Secure file download for the Knowledge Base. The browser client can't create
// signed URLs (storage RLS blocks it), so the server fetches the file with the
// admin client — only for a path that belongs to a REAL, approved document, and
// only for a logged-in user — then streams it back with a correct
// Content-Disposition so Marathi (non-ASCII) filenames download properly.

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const admin = createAdminClient();

  // Only serve paths that belong to an approved knowledge document.
  const { data: doc } = await admin
    .from("documents")
    .select("id,title,file_mime")
    .eq("file_path", path)
    .eq("status", "approved")
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data: blob, error } = await admin.storage.from("knowledge").download(path);
  if (error || !blob) {
    return NextResponse.json({ error: error?.message ?? "File not available" }, { status: 502 });
  }

  // Build a friendly download name from the document title + real extension.
  const ext = path.includes(".") ? "." + path.split(".").pop() : "";
  const base = (doc.title || "document")
    .replace(/[\\/:*?"<>|\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "document";
  const filename = `${base}${ext}`;
  // ASCII fallback + RFC 5987 (filename*) so browsers show the Marathi name.
  const ascii = (filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_")) || `document${ext}`;
  const disposition = `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;

  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": doc.file_mime || blob.type || "application/octet-stream",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
