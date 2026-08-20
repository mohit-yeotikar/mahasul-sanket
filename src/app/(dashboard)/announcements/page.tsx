import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsPanel, type Announcement } from "@/features/announcements/AnnouncementsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "घोषणा | महसूल संकेत" };

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || me.role === "citizen") redirect("/dashboard");

  // RLS returns state-wide + the viewer's district. If 0016 is not run yet, the
  // query errors and we render an empty panel rather than crashing.
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, district_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const canPost = ["district_admin", "state_admin", "super_admin"].includes(me.role);
  const canState = ["state_admin", "super_admin"].includes(me.role);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">घोषणा / Announcements</h1>
        <p className="mt-1 text-sm text-muted">विभागीय व राज्यस्तरीय घोषणा. / Departmental &amp; state-wide broadcasts.</p>
      </div>
      <AnnouncementsPanel items={(data ?? []) as Announcement[]} canPost={canPost} canState={canState} />
    </div>
  );
}
