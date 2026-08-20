import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleManagement, type ManagedUser } from "@/features/admin/RoleManagement";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "वापरकर्ता व्यवस्थापन | महसूल संकेत" };

const ALLOWED = ["district_admin", "state_admin", "super_admin"];

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role)) redirect("/dashboard");

  // RLS scopes to the admin's jurisdiction (district admin → own district; state → all).
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, mobile, role, status, taluka:talukas(name_mr,name_en)")
    .in("status", ["active", "suspended"])
    .neq("role", "citizen")
    .order("role")
    .limit(1000);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">वापरकर्ता व्यवस्थापन / User management</h1>
        <p className="mt-1 text-sm text-muted">
          भूमिका बदला व खाती स्थगित/सक्रिय करा — तुमच्या अधिकारक्षेत्रापुरते. / Change roles and suspend/reactivate accounts within your jurisdiction.
        </p>
      </div>
      <RoleManagement users={(users ?? []) as unknown as ManagedUser[]} viewerRole={me.role as UserRole} />
    </div>
  );
}
