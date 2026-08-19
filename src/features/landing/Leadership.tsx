"use client";

// Fold 2 — "मार्गदर्शन व नेतृत्व". Current office-holders verified Aug 2026.
// Two tiers: state political leadership, then the Revenue & Forest Department's
// political + administrative heads. Photos hotlink from the department site
// (rfd.maharashtra.gov.in/Image/manyavar) and Wikimedia; graceful monogram
// fallback if any image fails to load.

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

interface Leader {
  name_mr: string; name_en: string;
  desig_mr: string; desig_en: string;
  img: string;
}

// Tier 1 — state political leadership.
const STATE: Leader[] = [
  {
    name_mr: "श्री. नरेंद्र मोदी", name_en: "Shri Narendra Modi",
    desig_mr: "माननीय पंतप्रधान, भारत", desig_en: "Hon'ble Prime Minister of India",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg/330px-The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg",
  },
  {
    name_mr: "श्री. देवेंद्र फडणवीस", name_en: "Shri Devendra Fadnavis",
    desig_mr: "माननीय मुख्यमंत्री, महाराष्ट्र", desig_en: "Hon'ble Chief Minister, Maharashtra",
    img: "https://rfd.maharashtra.gov.in/Image/manyavar/Devendra%20fadnavis230414757242819206251716335.png",
  },
  {
    name_mr: "श्री. एकनाथ शिंदे", name_en: "Shri Eknath Shinde",
    desig_mr: "माननीय उपमुख्यमंत्री, महाराष्ट्र", desig_en: "Hon'ble Deputy Chief Minister",
    img: "https://rfd.maharashtra.gov.in/Image/manyavar/eknath%20shinde230008195242843531251625547.png",
  },
  {
    name_mr: "श्रीमती. सुनेत्रा पवार", name_en: "Smt. Sunetra Pawar",
    desig_mr: "माननीय उपमुख्यमंत्री, महाराष्ट्र", desig_en: "Hon'ble Deputy Chief Minister",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/President_of_India%2C_Pratibha_Patil_%28left%29_with_Sunetra_Ajitdada_Pawar_%28right%29_at_Rashtrapati_Bhavan_%28cropped%29_%282%29.jpg/330px-President_of_India%2C_Pratibha_Patil_%28left%29_with_Sunetra_Ajitdada_Pawar_%28right%29_at_Rashtrapati_Bhavan_%28cropped%29_%282%29.jpg",
  },
];

// Tier 2 — Revenue & Forest Department leadership (political + administrative).
const DEPT: Leader[] = [
  {
    name_mr: "श्री. चंद्रशेखर बावनकुळे", name_en: "Shri Chandrashekhar Bawankule",
    desig_mr: "माननीय महसूल मंत्री, महाराष्ट्र", desig_en: "Hon'ble Revenue Minister, Maharashtra",
    img: "https://rfd.maharashtra.gov.in/Image/manyavar/ChandrashekharKrishnaraoBawankule223e251358746.png",
  },
  {
    name_mr: "श्री. योगेश कदम", name_en: "Shri Yogesh Kadam",
    desig_mr: "माननीय महसूल राज्यमंत्री", desig_en: "Hon'ble Minister of State (Revenue)",
    img: "https://rfd.maharashtra.gov.in/Image/manyavar/yogeshkadam261843036.png",
  },
  {
    name_mr: "श्री. विकास खारगे (भा.प्र.से.)", name_en: "Shri Vikas Kharge, IAS",
    desig_mr: "अपर मुख्य सचिव (महसूल)", desig_en: "Additional Chief Secretary (Revenue)",
    img: "https://rfd.maharashtra.gov.in/Image/manyavar/vikaskharge263916376.png",
  },
];

function Portrait({ leader, size = "md" }: { leader: Leader; size?: "md" | "lg" }) {
  const [err, setErr] = useState(false);
  const initials = leader.name_en
    .replace(/,?\s*IAS$/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/^(Shri|Smt|Dr)\.?\s+/i, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const dim = size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20 sm:h-24 sm:w-24";
  return (
    <div
      className={`group relative ${dim} overflow-hidden rounded-full shadow-md ring-2 ring-primary/25 ring-offset-2 ring-offset-surface transition-transform duration-300 group-hover:scale-[1.03]`}
    >
      {err ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-primary-fg">
          {initials}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={leader.img}
          alt={leader.name_en}
          loading="lazy"
          onError={() => setErr(true)}
          className="h-full w-full object-cover object-top"
        />
      )}
      {/* subtle inner ring highlight */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" aria-hidden />
    </div>
  );
}

function Tier({ leaders, size, cols }: { leaders: Leader[]; size?: "md" | "lg"; cols: string }) {
  return (
    <Stagger className={`mx-auto grid max-w-3xl justify-items-center gap-x-4 gap-y-7 ${cols}`} gap={0.07} amount={0.25}>
      {leaders.map((l) => (
        <StaggerItem key={l.name_en} className="w-full max-w-[9.5rem]">
          <div className="group flex flex-col items-center px-1 text-center">
            <Portrait leader={l} size={size} />
            <p className="mt-3 text-[15px] font-extrabold leading-snug text-foreground">{l.name_mr}</p>
            <p className="mt-0.5 text-[12px] font-semibold leading-snug text-muted">
              {l.desig_mr}
            </p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function Leadership() {
  const { lang } = useLang();
  const M = lang === "mr";

  return (
    <section id="leadership" className="scroll-mt-24 border-y border-border bg-gradient-to-b from-surface to-surface-2/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {M ? "मार्गदर्शन व नेतृत्व" : "Guidance & Leadership"}
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            {M ? "यांच्या मार्गदर्शनाखाली" : "Under the guidance of"}
          </h2>
          <span className="mx-auto mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-secondary" aria-hidden />
        </Reveal>

        <Tier leaders={STATE} size="lg" cols="grid-cols-2 sm:grid-cols-4" />

        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {M ? "महसूल व वन विभाग" : "Revenue & Forest Department"}
          </p>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>

        <Tier leaders={DEPT} cols="grid-cols-3" />
      </div>
    </section>
  );
}
