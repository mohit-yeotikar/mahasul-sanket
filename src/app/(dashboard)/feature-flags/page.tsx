import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeatureFlagsPanel } from "@/features/admin/FeatureFlagsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "फीचर फ्लॅग्ज | महसूल संकेत" };

export default async function FeatureFlagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || me.role !== "super_admin") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">फीचर फ्लॅग्ज / Feature flags</h1>
        <p className="mt-1 text-sm text-muted">रीडिप्लॉयशिवाय वैशिष्ट्ये चालू/बंद करा. / Turn features on/off without a redeploy.</p>
      </div>
      <FeatureFlagsPanel />
    </div>
  );
}
