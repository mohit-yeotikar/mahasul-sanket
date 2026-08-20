import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DraftGenerator } from "@/features/tools/DraftGenerator";

export const dynamic = "force-dynamic";
export const metadata = { title: "मसुदा जनरेटर | महसूल संकेत" };

const STAFF = ["talathi", "circle_officer", "nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];

export default async function DraftPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !STAFF.includes(me.role)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">मसुदा जनरेटर / Draft generator</h1>
        <p className="mt-1 text-sm text-muted">
          नमुना ९ नोटीस, फेरफार नोंद व अधिकृत पत्रे — AI ने काही सेकंदात. / Namuna-9 notices, ferfar entries &amp; official letters — by AI in seconds.
        </p>
      </div>
      <DraftGenerator />
    </div>
  );
}
