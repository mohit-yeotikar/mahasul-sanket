"use client";

// Interactive "reach across Maharashtra" map for the public homepage. Reuses the
// real 36-district geometry (src/features/dashboard/maharashtra-map.json).
// Districts draw in on scroll, hover highlights + names the district, and a few
// flagship districts pulse as "live". Reduced-motion aware.

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/motion";
import MAP from "@/features/dashboard/maharashtra-map.json";

const map = MAP as {
  w: number;
  h: number;
  districts: { code: string; name: string; d: string; cx: number; cy: number }[];
};

// Marathi district names (fallback to English from the geometry file).
const MR: Record<string, string> = {
  GND: "गोंदिया", BHN: "भंडारा", JLG: "जळगाव", WRD: "वर्धा", BUL: "बुलढाणा",
  AKL: "अकोला", NSK: "नाशिक", GAD: "गडचिरोली", WSM: "वाशिम", CHN: "चंद्रपूर",
  YVT: "यवतमाळ", JAL: "जालना", AHM: "अहिल्यानगर", HIN: "हिंगोली", NND: "नांदेड",
  PBN: "परभणी", PUN: "पुणे", BED: "बीड", MUM: "मुंबई", LAT: "लातूर",
  DSV: "धाराशिव", SOL: "सोलापूर", SAT: "सातारा", RTN: "रत्नागिरी", SGL: "सांगली",
  KOL: "कोल्हापूर", SIN: "सिंधुदुर्ग", THN: "ठाणे", PAL: "पालघर", NDB: "नंदुरबार",
  AMR: "अमरावती", DHU: "धुळे", NAG: "नागपूर", AUR: "छत्रपती संभाजीनगर",
  RGD: "रायगड", MSU: "मुंबई उपनगर",
};

// Flagship districts that pulse as "live".
const LIVE = new Set(["MUM", "PUN", "NAG", "NSK", "AUR", "AMR", "NND", "KOL"]);

const REACH = [
  { mr: "जिल्हे", en: "Districts", val: "36" },
  { mr: "तालुके", en: "Talukas", val: "358" },
  { mr: "गावे", en: "Villages", val: "44,000+" },
  { mr: "उपलब्धता", en: "Availability", val: "24×7" },
];

export function CoverageMap() {
  const { lang } = useLang();
  const M = lang === "mr";
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);

  const hoveredGeo = hover ? map.districts.find((d) => d.code === hover) : null;
  const label = (code: string) => (M ? MR[code] ?? "" : "") || map.districts.find((d) => d.code === code)?.name || "";

  return (
    <section id="coverage" className="mx-auto w-full max-w-6xl px-4 py-14">
      <Reveal className="mb-9 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {M ? "उपस्थिती" : "Presence"}
        </p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
          {M ? "संपूर्ण महाराष्ट्रात, तुमच्या जिल्ह्यात" : "Across all of Maharashtra"}
        </h2>
      </Reveal>

      <div className="grid items-center gap-8 lg:grid-cols-2">
        {/* Copy + reach chips */}
        <Reveal className="order-2 lg:order-1">
          <p className="max-w-md text-base text-muted">
            {M
              ? "कोकणापासून विदर्भापर्यंत — महसूल संकेत राज्यातील प्रत्येक जिल्ह्यात नागरिक व अधिकाऱ्यांना मराठीत मदत करते."
              : "From Konkan to Vidarbha — Mahasul Sanket assists citizens and officers across every district, in Marathi."}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {REACH.map((r) => (
              <div key={r.en} className="rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
                <p className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent tabular-nums">
                  {r.val}
                </p>
                <p className="mt-0.5 text-sm font-medium text-muted">{M ? r.mr : r.en}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-muted">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            {M ? "थेट कार्यरत जिल्हे · नकाशावर फिरवून तुमचा जिल्हा पहा" : "Live districts · hover the map to find your district"}
          </p>
        </Reveal>

        {/* The map */}
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="relative mx-auto max-w-md">
            <svg
              viewBox={`0 0 ${map.w} ${map.h}`}
              role="img"
              aria-label={M ? "महाराष्ट्र जिल्हा नकाशा" : "Maharashtra district map"}
              className="w-full drop-shadow-sm"
            >
              {map.districts.map((d, i) => {
                const isHover = hover === d.code;
                return (
                  <motion.path
                    key={d.code}
                    d={d.d}
                    initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                    whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: Math.min(i * 0.02, 0.7), duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    style={{ transformOrigin: `${d.cx}px ${d.cy}px`, cursor: "pointer" }}
                    fill={
                      isHover
                        ? "var(--primary)"
                        : LIVE.has(d.code)
                          ? "color-mix(in srgb, var(--primary) 62%, var(--surface))"
                          : "color-mix(in srgb, var(--primary) 26%, var(--surface))"
                    }
                    stroke={isHover ? "var(--accent)" : "color-mix(in srgb, var(--primary) 45%, var(--surface))"}
                    strokeWidth={isHover ? 2 : 0.9}
                    onMouseEnter={() => setHover(d.code)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}

              {/* live pulse dots */}
              {map.districts
                .filter((d) => LIVE.has(d.code))
                .map((d) => (
                  <g key={`live-${d.code}`} pointerEvents="none">
                    <circle cx={d.cx} cy={d.cy} r="3.2" fill="var(--primary)" opacity="0.35">
                      {!reduce && <animate attributeName="r" values="3;8;3" dur="2.4s" repeatCount="indefinite" />}
                      {!reduce && <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />}
                    </circle>
                    <circle cx={d.cx} cy={d.cy} r="2.4" fill="var(--primary)" />
                  </g>
                ))}
            </svg>

            {/* hover tooltip */}
            {hoveredGeo && (
              <div
                className="pointer-events-none absolute z-10 flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-bold shadow-lg"
                style={{
                  left: `${(hoveredGeo.cx / map.w) * 100}%`,
                  top: `${(hoveredGeo.cy / map.h) * 100}%`,
                  transform: "translate(-50%, -130%)",
                }}
              >
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
                {label(hoveredGeo.code)}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
