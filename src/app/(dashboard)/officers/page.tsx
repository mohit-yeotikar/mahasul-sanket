import { createClient } from "@/lib/supabase/server";
import { OfficerDirectory, type DirectoryOfficer } from "@/features/dashboard/OfficerDirectory";

export const metadata = { title: "क्षेत्रातील अधिकारी | महसूल संकेत" };
export const dynamic = "force-dynamic";

export default async function OfficersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("district_id, district:districts(name_mr,name_en)")
    .eq("id", user!.id)
    .single();

  const districtId = (me as { district_id?: string } | null)?.district_id ?? null;

  const { data: officers } = districtId
    ? await supabase.rpc("area_officers", { p_district: districtId, p_taluka: null })
    : { data: [] as DirectoryOfficer[] };

  const dist = (me?.district as { name_mr?: string; name_en?: string } | null) ?? null;

  return (
    <OfficerDirectory
      officers={(officers ?? []) as DirectoryOfficer[]}
      districtNameMr={dist?.name_mr ?? null}
      districtNameEn={dist?.name_en ?? null}
    />
  );
}
