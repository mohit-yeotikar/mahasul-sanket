// Secure file download for the Knowledge Base. The browser client can't create
// signed URLs (storage RLS blocks it), so we sign on the server with the admin
// client — but only for a path that belongs to a REAL, approved document, and
// only for a logged-in user. Redirects to a short-lived signed download URL.

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

  // Only sign paths that actually belong to an approved knowledge document.
  const { data: doc } = await admin
    .from("documents")
    .select("id,title")
    .eq("file_path", path)
    .eq("status", "approved")
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const ext = path.includes(".") ? "." + path.split(".").pop() : "";
  const safeName = (doc.title || "document").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 80);

  const { data, error } = await admin.storage
    .from("knowledge")
    .createSignedUrl(path, 300, { download: `${safeName}${ext}` });

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message ?? "Could not sign the file." },
      { status: 502 }
    );
  }
  return NextResponse.redirect(data.signedUrl);
}
