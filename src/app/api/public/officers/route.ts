import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// Public "find your area officer" lookup — returns the government revenue
// officers (Talathi / Circle Officer / Nayab Tahsildar / DCO) serving a
// district+taluka, with the office contact number citizens are meant to reach.
// Only public-facing directory fields are returned (name, role, mobile, taluka).

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateLimit(`pub-officers:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "districts";
  const admin = createAdminClient();

  if (mode === "districts") {
    const { data } = await admin
      .from("districts")
      .select("id, name_mr, name_en")
      .order("name_en");
    return NextResponse.json({ districts: data ?? [] });
  }

  if (mode === "talukas") {
    const district = url.searchParams.get("district");
    if (!district) return NextResponse.json({ error: "district required" }, { status: 400 });
    const { data } = await admin
      .from("talukas")
      .select("id, name_mr, name_en")
      .eq("district_id", district)
      .order("name_en");
    return NextResponse.json({ talukas: data ?? [] });
  }

  if (mode === "officers") {
    const district = url.searchParams.get("district");
    const taluka = url.searchParams.get("taluka");
    if (!district) return NextResponse.json({ error: "district required" }, { status: 400 });

    let q = admin
      .from("profiles")
      .select("full_name, role, mobile, taluka:talukas(name_mr, name_en)")
      .eq("status", "active")
      .eq("district_id", district)
      .in("role", ["talathi", "circle_officer", "nayab_tahsildar", "dco"]);
    if (taluka) q = q.eq("taluka_id", taluka);

    const { data } = await q;
    const order: Record<string, number> = { talathi: 1, circle_officer: 2, nayab_tahsildar: 3, dco: 4 };
    const officers = (data ?? [])
      .map((o) => ({
        full_name: o.full_name as string,
        role: o.role as string,
        mobile: o.mobile as string,
        taluka: (o.taluka as { name_mr?: string; name_en?: string } | null) ?? null,
      }))
      .sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || a.full_name.localeCompare(b.full_name));
    return NextResponse.json({ officers });
  }

  return NextResponse.json({ error: "invalid mode" }, { status: 400 });
}
