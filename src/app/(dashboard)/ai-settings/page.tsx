import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AiSettingsForm } from "@/features/admin/AiSettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI सेटिंग्ज | महसूल संकेत" };

export default async function AiSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !["state_admin", "super_admin"].includes(me.role)) redirect("/dashboard");

  return <AiSettingsForm />;
}
