"use client";

// Area officer directory — a citizen (or field user) can look up and call
// the revenue officers serving their district, grouped by designation.

import { useMemo, useState } from "react";
import { Phone, Search, MapPin, Users } from "lucide-react";
import { Card, Input } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { ROLE_LABELS } from "@/lib/i18n/dictionaries";

export interface DirectoryOfficer {
  full_name: string;
  role: string;
  mobile: string;
  taluka_name_mr: string | null;
  taluka_name_en: string | null;
}

const ROLE_ORDER = ["talathi", "circle_officer", "nayab_tahsildar", "dco"];

export function OfficerDirectory({
  officers,
  districtNameMr,
  districtNameEn,
}: {
  officers: DirectoryOfficer[];
  districtNameMr: string | null;
  districtNameEn: string | null;
}) {
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const districtName = lang === "mr" ? districtNameMr : districtNameEn;

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = officers.filter((o) => {
      if (!needle) return true;
      const taluka = `${o.taluka_name_mr ?? ""} ${o.taluka_name_en ?? ""}`;
      return (
        o.full_name.toLowerCase().includes(needle) ||
        o.mobile.includes(needle) ||
        taluka.toLowerCase().includes(needle)
      );
    });
    return ROLE_ORDER.map((role) => ({
      role,
      officers: filtered.filter((o) => o.role === role),
    })).filter((g) => g.officers.length > 0);
  }, [officers, q]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Users className="h-6 w-6 text-primary" aria-hidden />
          {lang === "mr" ? "क्षेत्रातील अधिकारी" : "Area Officers"}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          {districtName && (
            <>
              <MapPin className="h-4 w-4" aria-hidden />
              {districtName}
              {lang === "mr" ? " जिल्हा" : " district"}
              {" · "}
            </>
          )}
          {lang === "mr"
            ? "तुमच्या महसूल विषयक शंकांसाठी थेट संपर्क साधा."
            : "Reach out directly for your revenue-related queries."}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "mr" ? "नाव, तालुका किंवा क्रमांक शोधा…" : "Search by name, taluka or number…"}
          className="pl-9"
        />
      </div>

      {!groups.length && (
        <Card className="p-10 text-center text-sm text-muted">
          {lang === "mr"
            ? "जुळणारे अधिकारी सापडले नाहीत."
            : "No matching officers found."}
        </Card>
      )}

      {groups.map((g) => (
        <section key={g.role} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {ROLE_LABELS[g.role]?.[lang] ?? g.role}
            <span className="ml-2 font-normal normal-case">({g.officers.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.officers.map((o, i) => (
              <Card key={`${o.mobile}-${i}`} className="flex flex-col gap-3 p-4">
                <div>
                  <p className="font-semibold">{o.full_name}</p>
                  <p className="text-sm text-muted">
                    {ROLE_LABELS[o.role]?.[lang] ?? o.role}
                    {(o.taluka_name_mr || o.taluka_name_en) &&
                      ` · ${lang === "mr" ? o.taluka_name_mr : o.taluka_name_en}`}
                  </p>
                </div>
                <a
                  href={`tel:${o.mobile}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-fg"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {o.mobile}
                </a>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
