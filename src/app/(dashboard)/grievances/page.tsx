import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GrievanceQueue, type GrievanceRow } from "@/features/grievances/GrievanceQueue";

export const dynamic = "force-dynamic";
export const metadata = { title: "नागरिक तक्रारी | महसूल संकेत" };

const OFFICERS = ["nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];

export default async function GrievancesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !OFFICERS.includes(me.role)) redirect("/dashboard");

  // RLS scopes rows to the officer's district. If the table is not migrated yet,
  // the query errors and we render an empty queue rather than crashing.
  const { data } = await supabase
    .from("grievances")
    .select("id, reference, citizen_name, mobile, category, subject, description, status, officer_note, created_at, taluka:talukas(name_mr,name_en)")
    .order("created_at", { ascending: false });

  return <GrievanceQueue grievances={(data ?? []) as unknown as GrievanceRow[]} />;
}
