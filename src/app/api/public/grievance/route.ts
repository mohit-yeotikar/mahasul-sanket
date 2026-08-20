import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isFeatureEnabled } from "@/lib/feature-flags";

const CATEGORIES = [
  "mutation", "seven_twelve", "ferfar", "crop_entry", "inheritance",
  "revenue", "survey", "map", "certificates", "digital_signature",
  "technical_issue", "others",
] as const;

const submitSchema = z.object({
  citizen_name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "10-digit mobile"),
  district_id: z.string().uuid().optional().nullable(),
  taluka_id: z.string().uuid().optional().nullable(),
  category: z.enum(CATEGORIES).default("others"),
  subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(4000),
});

function ipOf(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
}

// Submit a grievance (no login).
export async function POST(req: NextRequest) {
  if (!(await isFeatureEnabled("grievances"))) {
    return NextResponse.json({ error: "तक्रार नोंदणी सध्या बंद आहे. / Grievance submission is currently disabled." }, { status: 503 });
  }
  if (!rateLimit(`grievance-submit:${ipOf(req)}`, 6, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }
  const parsed = submitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", detail: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("grievances")
    .insert({
      citizen_name: parsed.data.citizen_name,
      mobile: parsed.data.mobile,
      district_id: parsed.data.district_id ?? null,
      taluka_id: parsed.data.taluka_id ?? null,
      category: parsed.data.category,
      subject: parsed.data.subject,
      description: parsed.data.description,
    })
    .select("reference, status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not submit grievance. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ reference: data.reference, status: data.status });
}

// Track a grievance by reference + mobile (both required to prevent enumeration).
export async function GET(req: NextRequest) {
  if (!rateLimit(`grievance-track:${ipOf(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference")?.trim();
  const mobile = url.searchParams.get("mobile")?.trim();
  if (!reference || !mobile) {
    return NextResponse.json({ error: "reference and mobile required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("grievances")
    .select("reference, subject, category, status, officer_note, created_at, updated_at")
    .eq("reference", reference)
    .eq("mobile", mobile)
    .maybeSingle();

  if (!data) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, grievance: data });
}
