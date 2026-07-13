import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BulkUpload } from "@/features/admin/BulkUpload";

export const metadata = { title: "बल्क अपलोड | महसूल संकेत" };

export default async function BulkUploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin", "state_admin"].includes(profile.role)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">बल्क दस्तऐवज अपलोड / Bulk Document Upload</h1>
        <p className="mt-1 text-sm text-muted">
          एकाच वेळी अनेक शासन निर्णय / परिपत्रके अपलोड करा. प्रत्येक दस्तऐवज AI आपोआप ओळखतो,
          शीर्षक व प्रकार नेमतो, डुप्लिकेट तपासतो आणि ज्ञान भांडारात अनुक्रमित करतो.
        </p>
        <p className="text-xs text-muted">
          Upload many GRs/circulars at once — the AI identifies each one, assigns a title,
          description and category, skips duplicates, and indexes it into the knowledge base.
        </p>
      </div>
      <BulkUpload />
    </div>
  );
}
