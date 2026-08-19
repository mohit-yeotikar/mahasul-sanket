"use client";

// Leadership banner — current office-holders (verified Aug 2026), photos from
// Wikimedia Commons. Graceful initials fallback if an image fails to load.
// Replace the img URLs with official approved photos when this goes live.

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";

interface Leader {
  name_mr: string; name_en: string;
  desig_mr: string; desig_en: string;
  img: string; highlight?: boolean;
}

const LEADERS: Leader[] = [
  {
    name_mr: "श्री. नरेंद्र मोदी", name_en: "Shri Narendra Modi",
    desig_mr: "माननीय पंतप्रधान, भारत", desig_en: "Hon'ble Prime Minister of India",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg/330px-The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg",
  },
  {
    name_mr: "श्री. देवेंद्र फडणवीस", name_en: "Shri Devendra Fadnavis",
    desig_mr: "माननीय मुख्यमंत्री, महाराष्ट्र", desig_en: "Hon'ble Chief Minister, Maharashtra",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Shri_Devendra_Gangadharrao_Fadnavis.jpg/330px-Shri_Devendra_Gangadharrao_Fadnavis.jpg",
  },
  {
    name_mr: "श्री. एकनाथ शिंदे", name_en: "Shri Eknath Shinde",
    desig_mr: "माननीय उपमुख्यमंत्री, महाराष्ट्र", desig_en: "Hon'ble Deputy Chief Minister",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Eknath_Shinde_SS.jpg/330px-Eknath_Shinde_SS.jpg",
  },
  {
    name_mr: "श्रीमती. सुनेत्रा पवार", name_en: "Smt. Sunetra Pawar",
    desig_mr: "माननीय उपमुख्यमंत्री, महाराष्ट्र", desig_en: "Hon'ble Deputy Chief Minister",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/President_of_India%2C_Pratibha_Patil_%28left%29_with_Sunetra_Ajitdada_Pawar_%28right%29_at_Rashtrapati_Bhavan_%28cropped%29_%282%29.jpg/330px-President_of_India%2C_Pratibha_Patil_%28left%29_with_Sunetra_Ajitdada_Pawar_%28right%29_at_Rashtrapati_Bhavan_%28cropped%29_%282%29.jpg",
  },
  {
    name_mr: "श्री. चंद्रशेखर बावनकुळे", name_en: "Shri Chandrashekhar Bawankule",
    desig_mr: "माननीय महसूल मंत्री, महाराष्ट्र", desig_en: "Hon'ble Revenue Minister, Maharashtra",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/The_Maharashtra_Energy_Minister%2C_Shri_Chandrashkahr_Bawankule_calling_on_the_Minister_of_State_%28IC%29_for_Power_and_New_and_Renewable_Energy%2C_Shri_Raj_Kumar_Singh%2C_in_New_Delhi_on_October_16%2C_2017_%28cropped%29.jpg/330px-thumbnail.jpg",
    highlight: true,
  },
];

function Portrait({ leader }: { leader: Leader }) {
  const [err, setErr] = useState(false);
  const initials = leader.name_en.replace(/^(Shri|Smt|Dr)\.?\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
  return (
    <div
      className={`relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-surface sm:h-24 sm:w-24 ${
        leader.highlight ? "ring-accent" : "ring-primary/25"
      }`}
    >
      {err ? (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
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
    </div>
  );
}

export function Leadership() {
  const { lang } = useLang();
  const M = lang === "mr";
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          {M ? "मार्गदर्शन व नेतृत्व" : "Under the guidance of"}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {LEADERS.map((l) => (
            <div key={l.name_en} className="flex flex-col items-center px-1 text-center">
              <Portrait leader={l} />
              <p className="mt-2.5 text-sm font-bold leading-snug">{M ? l.name_mr : l.name_en}</p>
              <p className={`text-[11px] leading-snug ${l.highlight ? "font-semibold text-accent" : "text-muted"}`}>
                {M ? l.desig_mr : l.desig_en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
