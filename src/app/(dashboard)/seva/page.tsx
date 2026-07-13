"use client";

// Seva — one-stop access to Government of Maharashtra revenue & land services.
// External official portals open in a new tab; services marked "coming soon"
// will get an in-app interface in a later phase.

import { motion } from "framer-motion";
import {
  FileText, Map, Landmark, Sprout, ClipboardList, Stamp, BadgeIndianRupee,
  FileSignature, Ruler, Building2, HandCoins, ScrollText, ArrowUpRight, Clock,
} from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

type Icon = React.ComponentType<{ className?: string }>;
interface Service {
  icon: Icon;
  mr: string;
  en: string;
  descMr: string;
  descEn: string;
  url?: string; // omitted = in-app interface coming soon
}
interface Group {
  mr: string;
  en: string;
  services: Service[];
}

const GROUPS: Group[] = [
  {
    mr: "भूमी अभिलेख",
    en: "Land Records",
    services: [
      { icon: FileText, mr: "महाभूलेख (७/१२ व ८अ)", en: "Mahabhulekh (7/12 & 8A)", descMr: "डिजिटल जमीन अभिलेख पहा", descEn: "View digital land records", url: "https://bhulekh.mahabhumi.gov.in" },
      { icon: Map, mr: "महाभूनकाशा", en: "Maha Bhu Naksha", descMr: "गट/सर्व्हे नकाशा पहा", descEn: "Land parcel maps", url: "https://mahabhunakasha.mahabhumi.gov.in" },
      { icon: FileSignature, mr: "डिजिटल स्वाक्षरीत ७/१२", en: "Digitally Signed 7/12", descMr: "स्वाक्षरीत उतारा डाउनलोड करा", descEn: "Download signed extract", url: "https://digitalsatbara.mahabhumi.gov.in/DSLR" },
      { icon: ScrollText, mr: "ई-रेखा (स्कॅन नकाशे)", en: "e-Rekha (Scanned Maps)", descMr: "अभिलेख नकाशांच्या प्रती", descEn: "Record map copies" },
    ],
  },
  {
    mr: "फेरफार व नोंदी",
    en: "Mutation & Entries",
    services: [
      { icon: ClipboardList, mr: "ई-फेरफार", en: "e-Ferfar (Mutation)", descMr: "ऑनलाइन फेरफार नोंद", descEn: "Online mutation entry" },
      { icon: Sprout, mr: "ई-पीक पाहणी", en: "e-Peek Pahani", descMr: "पीक नोंदणी (मोबाइल ॲप)", descEn: "Crop survey (mobile app)" },
      { icon: Landmark, mr: "ई-चावडी", en: "e-Chavadi", descMr: "गाव दप्तर सूचना फलक", descEn: "Village digital notice board" },
      { icon: Ruler, mr: "भूमी मोजणी", en: "Land Measurement", descMr: "मोजणी अर्ज व स्थिती", descEn: "Measurement application" },
    ],
  },
  {
    mr: "नोंदणी व मुद्रांक",
    en: "Registration & Stamps",
    services: [
      { icon: Stamp, mr: "SARITA / IGR", en: "SARITA / IGR", descMr: "दस्त नोंदणी, ई-सर्च, मुद्रांक", descEn: "Registration, e-Search, stamps", url: "https://igrmaharashtra.gov.in" },
      { icon: BadgeIndianRupee, mr: "GRAS (ई-चलन)", en: "GRAS (e-Challan)", descMr: "शासकीय देयके ऑनलाइन भरा", descEn: "Pay government dues online", url: "https://gras.mahakosh.gov.in" },
    ],
  },
  {
    mr: "नागरिक सेवा",
    en: "Citizen Services",
    services: [
      { icon: Building2, mr: "आपले सरकार", en: "Aaple Sarkar (RTS)", descMr: "दाखले व सेवा हक्क", descEn: "Certificates & Right to Services", url: "https://aaplesarkar.mahaonline.gov.in" },
      { icon: HandCoins, mr: "MahaDBT", en: "MahaDBT", descMr: "शेतकरी योजना व लाभ", descEn: "Farmer schemes & benefits", url: "https://mahadbt.maharashtra.gov.in" },
    ],
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function SevaPage() {
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === "mr" ? "सेवा" : "Services"}</h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "mr"
            ? "महाराष्ट्र शासनाच्या महसूल व भूमी सेवा एकाच ठिकाणी. अधिकृत पोर्टल नवीन टॅबमध्ये उघडेल."
            : "Government of Maharashtra revenue & land services in one place. Official portals open in a new tab."}
        </p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.en} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {lang === "mr" ? g.mr : g.en}
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {g.services.map((s) => {
              const inner = (
                <Card
                  className={cn(
                    "group h-full p-4 transition-all",
                    s.url ? "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" : "opacity-90"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-semibold">{lang === "mr" ? s.mr : s.en}</h3>
                        {s.url ? (
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{lang === "mr" ? s.descMr : s.descEn}</p>
                      {!s.url && (
                        <Badge tone="warning" className="mt-2">
                          <Clock className="mr-1 inline h-3 w-3" aria-hidden />
                          {lang === "mr" ? "लवकरच" : "Coming soon"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );

              return (
                <motion.div key={s.en} variants={item}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      ))}

      <p className="pt-2 text-center text-xs text-muted">
        {lang === "mr"
          ? "टीप: बाह्य दुवे महाराष्ट्र शासनाच्या अधिकृत संकेतस्थळांकडे नेतात. 'लवकरच' चिन्हांकित सेवा येत्या टप्प्यात ॲपमध्ये समाविष्ट होतील."
          : "Note: External links go to official Government of Maharashtra portals. Services marked 'Coming soon' will be integrated into the app in a later phase."}
      </p>
    </div>
  );
}
