"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search as SearchIcon, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Card, Input, Select, Skeleton } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DocumentType } from "@/types";

const DOC_TYPES: { value: DocumentType | ""; mr: string; en: string }[] = [
  { value: "", mr: "सर्व प्रकार", en: "All types" },
  { value: "gr", mr: "शासन निर्णय (GR)", en: "GR" },
  { value: "circular", mr: "परिपत्रक", en: "Circular" },
  { value: "faq", mr: "वारंवार विचारले जाणारे प्रश्न", en: "FAQ" },
  { value: "sop", mr: "कार्यपद्धती (SOP)", en: "SOP" },
  { value: "notification", mr: "अधिसूचना", en: "Notification" },
  { value: "manual", mr: "नियमपुस्तिका", en: "Manual" },
  { value: "other", mr: "इतर", en: "Other" },
];

export function KnowledgeBrowser() {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [q, setQ] = useState("");
  const [docType, setDocType] = useState("");
  const [year, setYear] = useState("");

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", q, docType, year],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("id,title,doc_type,gr_number,circular_number,department,issued_date,tags,file_path,summary")
        .eq("status", "approved")
        .order("issued_date", { ascending: false, nullsFirst: false })
        .limit(50);
      if (q) query = query.or(`title.ilike.%${q}%,gr_number.ilike.%${q}%,circular_number.ilike.%${q}%`);
      if (docType) query = query.eq("doc_type", docType);
      if (year) query = query.eq("year", Number(year));
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const openFile = async (path: string) => {
    const { data } = await supabase.storage.from("knowledge").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">{t("knowledgeBase")}</h1>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted" aria-hidden />
          <Input
            className="pl-10"
            placeholder={t("search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("search")}
          />
        </div>
        <Select value={docType} onChange={(e) => setDocType(e.target.value)} className="sm:w-56" aria-label={t("category")}>
          {DOC_TYPES.map((d) => (
            <option key={d.value} value={d.value}>{lang === "mr" ? d.mr : d.en}</option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)} className="sm:w-32" aria-label="Year">
          <option value="">{lang === "mr" ? "वर्ष" : "Year"}</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!isLoading && !docs?.length && (
        <Card className="p-10 text-center text-muted">
          <FileText className="mx-auto mb-3 h-10 w-10" aria-hidden />
          {lang === "mr" ? "दस्तऐवज सापडले नाहीत." : "No documents found."}
        </Card>
      )}

      <div className="space-y-3">
        {docs?.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{d.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {d.gr_number && <>GR: {d.gr_number} · </>}
                  {d.circular_number && <>{lang === "mr" ? "परिपत्रक" : "Circular"}: {d.circular_number} · </>}
                  {d.department && <>{d.department} · </>}
                  {d.issued_date}
                </p>
                {d.summary && <p className="mt-2 line-clamp-2 text-sm">{d.summary}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone="primary">
                    {DOC_TYPES.find((x) => x.value === d.doc_type)?.[lang] ?? d.doc_type}
                  </Badge>
                  {d.tags?.map((tag: string) => <Badge key={tag}>{tag}</Badge>)}
                </div>
              </div>
              {d.file_path && (
                <Button variant="outline" size="sm" onClick={() => openFile(d.file_path!)}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
