import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/i18n/dictionaries";

export const metadata = { title: "प्रोफाइल | महसूल संकेत" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase
    .from("profiles")
    .select("*, district:districts(name_mr,name_en), taluka:talukas(name_mr,name_en)")
    .eq("id", user!.id)
    .single();

  if (!p) return null;

  const rows: [string, React.ReactNode][] = [
    ["नाव / Name", p.full_name],
    ["मोबाईल / Mobile", p.mobile],
    ["शासकीय ID / Government ID", p.government_id],
    ["भूमिका / Role", ROLE_LABELS[p.role]?.mr ?? p.role],
    ["जिल्हा / District", p.district?.name_mr ?? "—"],
    ["तालुका / Taluka", p.taluka?.name_mr ?? "—"],
    ["स्थिती / Status", <Badge key="s" tone={p.status === "active" ? "success" : "warning"}>{p.status}</Badge>],
    ["सदस्य दिनांक / Member since", new Date(p.created_at).toLocaleDateString("mr-IN")],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">प्रोफाइल / Profile</h1>
      <Card className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="font-medium">{value}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
