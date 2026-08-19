"use client";

// GOAL 2 — Impact stats band. Six cards (even), count-up on scroll into view.
// Numbers are illustrative demo figures (labelled "प्रात्यक्षिक आकडेवारी").

import {
  Users, Target, Timer, Gauge, MapPinned, FileStack,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CountUp, Stagger, StaggerItem } from "@/components/motion";

type Stat = {
  icon: React.ComponentType<{ className?: string }>;
  to: number;
  decimals?: number;
  prefix?: string;
  suffix_mr?: string;
  suffix_en?: string;
  mr: string;
  en: string;
};

const STATS: Stat[] = [
  { icon: Users, to: 248600, suffix_mr: "+", suffix_en: "+", mr: "नागरिकांना सेवा दिली", en: "Citizens served" },
  { icon: Target, to: 96.89, decimals: 2, suffix_mr: "%", suffix_en: "%", mr: "AI उत्तर अचूकता", en: "AI answer accuracy" },
  { icon: Gauge, to: 90, suffix_mr: "%", suffix_en: "%", mr: "अधिकाऱ्यांचा वेळ वाचला", en: "Officer time saved" },
  { icon: Timer, to: 4.6, decimals: 1, suffix_mr: " सेकंद", suffix_en: "s", mr: "सरासरी उत्तर वेळ", en: "Avg. response time" },
  { icon: MapPinned, to: 36, mr: "जिल्हे कार्यरत", en: "Districts live" },
  { icon: FileStack, to: 1240, suffix_mr: "+", suffix_en: "+", mr: "शासन निर्णय समाविष्ट", en: "GRs indexed" },
];

export function ImpactStats() {
  const { lang } = useLang();
  const M = lang === "mr";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <div className="mb-9 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {M ? "परिणाम" : "Impact"}
        </p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
          {M ? "आकड्यांमध्ये" : "In numbers"}
        </h2>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary sm:text-base">
          {M ? "प्रात्यक्षिक आकडेवारी" : "Illustrative demo figures"}
        </p>
      </div>

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" gap={0.09} amount={0.15}>
        {STATS.map((s) => (
          <StaggerItem key={s.en}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-surface/80 p-5 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg sm:p-6">
              {/* corner glow */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-70" aria-hidden />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary ring-1 ring-inset ring-primary/10">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="relative mt-4 bg-gradient-to-br from-primary to-secondary bg-clip-text text-3xl font-extrabold tabular-nums tracking-tight text-transparent sm:text-4xl">
                <CountUp
                  to={s.to}
                  decimals={s.decimals}
                  prefix={s.prefix}
                  suffix={M ? s.suffix_mr : s.suffix_en}
                />
              </p>
              <p className="relative mt-1.5 text-sm font-medium text-muted">{M ? s.mr : s.en}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
