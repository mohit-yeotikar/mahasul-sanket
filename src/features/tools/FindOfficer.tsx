"use client";

// Citizen tool — find your area revenue officers. District → Taluka → the
// Talathi / Circle Officer / Nayab Tahsildar / DCO serving that area, with a
// tap-to-call number. Data via the public /api/public/officers endpoint.

import { useEffect, useState } from "react";
import { Phone, MapPin, UserRound, Search } from "lucide-react";
import { Select, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { ROLE_LABELS } from "@/lib/i18n/dictionaries";
import type { UserRole } from "@/types";

interface Geo { id: string; name_mr: string; name_en: string; }
interface Officer { full_name: string; role: string; mobile: string; taluka: { name_mr?: string; name_en?: string } | null; }

export function FindOfficer() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [districts, setDistricts] = useState<Geo[]>([]);
  const [talukas, setTalukas] = useState<Geo[]>([]);
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [officers, setOfficers] = useState<Officer[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/public/officers?mode=districts")
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts ?? []))
      .catch(() => {});
  }, []);

  const onDistrict = (id: string) => {
    setDistrict(id);
    setTaluka("");
    setTalukas([]);
    setOfficers(null);
    if (!id) return;
    fetch(`/api/public/officers?mode=talukas&district=${id}`)
      .then((r) => r.json())
      .then((d) => setTalukas(d.talukas ?? []))
      .catch(() => {});
  };

  const search = async () => {
    if (!district) return;
    setLoading(true);
    setOfficers(null);
    try {
      const q = `mode=officers&district=${district}${taluka ? `&taluka=${taluka}` : ""}`;
      const res = await fetch(`/api/public/officers?${q}`);
      const d = await res.json();
      setOfficers(d.officers ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {M
          ? "तुमचा जिल्हा व तालुका निवडा — तुमच्या क्षेत्रातील महसूल अधिकाऱ्यांचे संपर्क क्रमांक मिळवा."
          : "Pick your district and taluka to get the contact numbers of the revenue officers serving your area."}
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Select value={district} onChange={(e) => onDistrict(e.target.value)} aria-label={M ? "जिल्हा" : "District"}>
          <option value="">{M ? "जिल्हा निवडा" : "Select district"}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{M ? d.name_mr : d.name_en}</option>
          ))}
        </Select>
        <Select value={taluka} onChange={(e) => setTaluka(e.target.value)} disabled={!district} aria-label={M ? "तालुका" : "Taluka"}>
          <option value="">{M ? "सर्व तालुके" : "All talukas"}</option>
          {talukas.map((t) => (
            <option key={t.id} value={t.id}>{M ? t.name_mr : t.name_en}</option>
          ))}
        </Select>
        <button
          onClick={search}
          disabled={!district || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-fg hover:brightness-110 disabled:opacity-50"
        >
          {loading ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" aria-hidden />}
          {M ? "शोधा" : "Find"}
        </button>
      </div>

      {officers && officers.length === 0 && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          {M ? "या क्षेत्रासाठी अधिकारी नोंद आढळली नाही. कृपया तहसील कार्यालयाशी संपर्क साधा." : "No officer records found for this area. Please contact the Tahsil office."}
        </p>
      )}

      {officers && officers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {officers.map((o, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{o.full_name}</p>
                  <p className="text-xs font-medium text-primary">{ROLE_LABELS[o.role as UserRole]?.[lang] ?? o.role}</p>
                  {o.taluka && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {M ? o.taluka.name_mr : o.taluka.name_en}
                    </p>
                  )}
                  {o.mobile && (
                    <a href={`tel:${o.mobile}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-fg">
                      <Phone className="h-3.5 w-3.5" aria-hidden />{o.mobile}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
