"use client";

// Citizen tool — document checklist generator. Curated (not AI-generated, so it
// stays accurate) list of required papers, fees and timelines for common
// revenue services. Pick a service → get the checklist.

import { useState } from "react";
import { FileText, IndianRupee, Clock, Building2, CheckCircle2, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

interface Service {
  key: string;
  mr: string; en: string;
  docs_mr: string[]; docs_en: string[];
  fee_mr: string; fee_en: string;
  time_mr: string; time_en: string;
  office_mr: string; office_en: string;
}

const SERVICES: Service[] = [
  {
    key: "712", mr: "७/१२ उतारा", en: "7/12 Extract",
    docs_mr: ["गट क्रमांक / सर्व्हे क्रमांक", "आधार कार्ड", "जुना ७/१२ (असल्यास)"],
    docs_en: ["Gat/Survey number", "Aadhaar card", "Old 7/12 (if any)"],
    fee_mr: "₹15 (डिजिटल स्वाक्षरीत)", fee_en: "₹15 (digitally signed)",
    time_mr: "तत्काळ (ऑनलाइन)", time_en: "Instant (online)",
    office_mr: "महाभूलेख पोर्टल / तलाठी", office_en: "Mahabhulekh portal / Talathi",
  },
  {
    key: "mutation", mr: "फेरफार नोंद (वारस/खरेदी)", en: "Mutation (Ferfar)",
    docs_mr: ["अर्ज (नमुना ६)", "खरेदीखत / वारस दाखला / मृत्यू दाखला", "७/१२ व ८अ उतारा", "आधार व फोटो"],
    docs_en: ["Application (Namuna 6)", "Sale deed / heirship / death certificate", "7/12 & 8A extract", "Aadhaar & photo"],
    fee_mr: "नाममात्र नोंदणी शुल्क", fee_en: "Nominal registration fee",
    time_mr: "१५–४५ दिवस (हरकतीनुसार)", time_en: "15–45 days (subject to objections)",
    office_mr: "तलाठी → मंडळ अधिकारी", office_en: "Talathi → Circle Officer",
  },
  {
    key: "income", mr: "उत्पन्नाचा दाखला", en: "Income Certificate",
    docs_mr: ["आधार कार्ड", "रेशन कार्ड", "उत्पन्नाचा पुरावा (तलाठी अहवाल)", "स्वयंघोषणापत्र"],
    docs_en: ["Aadhaar card", "Ration card", "Proof of income (Talathi report)", "Self-declaration"],
    fee_mr: "₹34 (आपले सरकार)", fee_en: "₹34 (Aaple Sarkar)",
    time_mr: "१५ दिवस (सेवा हमी)", time_en: "15 days (RTS)",
    office_mr: "आपले सरकार / तहसील", office_en: "Aaple Sarkar / Tahsil",
  },
  {
    key: "domicile", mr: "रहिवासी (अधिवास) दाखला", en: "Domicile Certificate",
    docs_mr: ["आधार कार्ड", "रहिवासाचा पुरावा (१५+ वर्षे)", "शाळा सोडल्याचा दाखला", "स्वयंघोषणापत्र"],
    docs_en: ["Aadhaar card", "Proof of residence (15+ years)", "School leaving certificate", "Self-declaration"],
    fee_mr: "₹34 (आपले सरकार)", fee_en: "₹34 (Aaple Sarkar)",
    time_mr: "१५ दिवस (सेवा हमी)", time_en: "15 days (RTS)",
    office_mr: "आपले सरकार / तहसील", office_en: "Aaple Sarkar / Tahsil",
  },
  {
    key: "caste", mr: "जातीचा दाखला", en: "Caste Certificate",
    docs_mr: ["आधार कार्ड", "वडिलांचा/नातेवाईकांचा जात पुरावा", "शाळा सोडल्याचा दाखला", "रहिवासी पुरावा"],
    docs_en: ["Aadhaar card", "Father's/relative's caste proof", "School leaving certificate", "Residence proof"],
    fee_mr: "₹34 (आपले सरकार)", fee_en: "₹34 (Aaple Sarkar)",
    time_mr: "२१ दिवस (सेवा हमी)", time_en: "21 days (RTS)",
    office_mr: "आपले सरकार / उपविभागीय अधिकारी", office_en: "Aaple Sarkar / SDO",
  },
  {
    key: "na", mr: "बिनशेती (NA) परवानगी", en: "Non-Agricultural (NA) Permission",
    docs_mr: ["७/१२ व फेरफार उतारे", "मोजणी नकाशा", "नगररचना NA आराखडा", "कर भरल्याच्या पावत्या"],
    docs_en: ["7/12 & mutation extracts", "Measurement map", "Town-planning NA layout", "Tax paid receipts"],
    fee_mr: "रूपांतरण कर (क्षेत्रानुसार)", fee_en: "Conversion tax (as per area)",
    time_mr: "६०–९० दिवस", time_en: "60–90 days",
    office_mr: "उपविभागीय अधिकारी / जिल्हाधिकारी", office_en: "SDO / Collector",
  },
  {
    key: "mojani", mr: "जमीन मोजणी", en: "Land Measurement (Mojani)",
    docs_mr: ["मोजणी अर्ज", "७/१२ उतारा", "आधार कार्ड", "मोजणी फी चलन"],
    docs_en: ["Measurement application", "7/12 extract", "Aadhaar card", "Measurement fee challan"],
    fee_mr: "प्रकारानुसार (साधी/तातडीची/अति-तातडीची)", fee_en: "By type (regular/urgent/super-urgent)",
    time_mr: "६०–१८० दिवस (प्रकारानुसार)", time_en: "60–180 days (by type)",
    office_mr: "भूमी अभिलेख कार्यालय", office_en: "Land Records office",
  },
  {
    key: "solvency", mr: "सॉल्व्हन्सी (ऐपत) दाखला", en: "Solvency Certificate",
    docs_mr: ["मालमत्तेचे ७/१२ / मालकी पुरावे", "मूल्यांकन अहवाल", "आधार कार्ड", "कर पावत्या"],
    docs_en: ["Property 7/12 / ownership proof", "Valuation report", "Aadhaar card", "Tax receipts"],
    fee_mr: "मुद्रांक + नाममात्र शुल्क", fee_en: "Stamp + nominal fee",
    time_mr: "१५–३० दिवस", time_en: "15–30 days",
    office_mr: "तहसील / उपविभागीय अधिकारी", office_en: "Tahsil / SDO",
  },
];

export function DocumentChecklist() {
  const { lang } = useLang();
  const M = lang === "mr";
  const [open, setOpen] = useState<string>("712");
  const active = SERVICES.find((s) => s.key === open);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {M
          ? "सेवा निवडा — लागणारी कागदपत्रे, शुल्क व अपेक्षित कालावधी पहा."
          : "Pick a service to see the required documents, fees and expected timeline."}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SERVICES.map((s) => (
          <button
            key={s.key}
            onClick={() => setOpen(s.key)}
            className={`rounded-xl border p-3 text-left text-sm font-semibold transition-all ${
              open === s.key
                ? "border-primary bg-primary text-primary-fg shadow-sm"
                : "border-border bg-surface hover:border-primary/40 hover:shadow-sm"
            }`}
          >
            {M ? s.mr : s.en}
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            {M ? active.mr : active.en}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><IndianRupee className="h-3.5 w-3.5" aria-hidden />{M ? "शुल्क" : "Fee"}</p>
              <p className="mt-1 text-sm font-semibold">{M ? active.fee_mr : active.fee_en}</p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Clock className="h-3.5 w-3.5" aria-hidden />{M ? "कालावधी" : "Timeline"}</p>
              <p className="mt-1 text-sm font-semibold">{M ? active.time_mr : active.time_en}</p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Building2 className="h-3.5 w-3.5" aria-hidden />{M ? "कार्यालय" : "Office"}</p>
              <p className="mt-1 text-sm font-semibold">{M ? active.office_mr : active.office_en}</p>
            </div>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><ChevronDown className="h-4 w-4 text-primary" aria-hidden />{M ? "आवश्यक कागदपत्रे" : "Required documents"}</p>
          <ul className="mt-2 space-y-2">
            {(M ? active.docs_mr : active.docs_en).map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
