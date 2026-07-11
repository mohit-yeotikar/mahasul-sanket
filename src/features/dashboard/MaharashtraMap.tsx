"use client";

// Interactive Maharashtra choropleth — pure SVG, no map library.
// Color = active ticket load; red ring = overdue SLA present.
// Hover for details, click to open that district's data.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageProvider";
import MAP from "./maharashtra-map.json";

export interface DistrictMetric {
  code: string;
  nameMr: string;
  active: number;
  overdue: number;
  pendingUsers: number;
}

interface MapData {
  w: number;
  h: number;
  districts: { code: string; name: string; d: string; cx: number; cy: number }[];
}

const map = MAP as MapData;

export function MaharashtraMap({
  metrics,
  onSelect,
}: {
  metrics: Record<string, DistrictMetric>;
  onSelect?: (code: string) => void;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  const maxActive = useMemo(
    () => Math.max(1, ...Object.values(metrics).map((m) => m.active)),
    [metrics]
  );

  const fill = (code: string) => {
    const m = metrics[code];
    if (!m || m.active === 0) return "var(--surface-2)";
    const t = m.active / maxActive; // 0..1
    // leaf-green ramp: light → deep primary green
    const alpha = 0.25 + t * 0.75;
    return `color-mix(in srgb, var(--primary) ${Math.round(alpha * 100)}%, var(--surface-2))`;
  };

  const hovered = hover ? metrics[hover] : null;
  const hoveredGeo = hover ? map.districts.find((d) => d.code === hover) : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${map.w} ${map.h}`}
        role="img"
        aria-label={lang === "mr" ? "महाराष्ट्र जिल्हा नकाशा" : "Maharashtra district map"}
        className="w-full"
      >
        {map.districts.map((d, i) => {
          const m = metrics[d.code];
          const isHover = hover === d.code;
          return (
            <motion.path
              key={d.code}
              d={d.d}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.02 * i, duration: 0.4 }}
              fill={fill(d.code)}
              stroke={isHover ? "var(--accent)" : m && m.overdue > 0 ? "var(--danger)" : "var(--border)"}
              strokeWidth={isHover ? 2.5 : m && m.overdue > 0 ? 1.8 : 0.8}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(d.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                onSelect ? onSelect(d.code) : router.push(`/reports?district=${d.code}`)
              }
            />
          );
        })}
        {/* overdue alert dots */}
        {map.districts.map((d) => {
          const m = metrics[d.code];
          if (!m || m.overdue === 0) return null;
          return (
            <g key={`dot-${d.code}`} pointerEvents="none">
              <circle cx={d.cx} cy={d.cy} r="7" fill="var(--danger)" opacity="0.25">
                <animate attributeName="r" values="6;11;6" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle cx={d.cx} cy={d.cy} r="3.5" fill="var(--danger)" />
            </g>
          );
        })}
      </svg>

      {/* tooltip */}
      {hovered && hoveredGeo && (
        <div
          className="pointer-events-none absolute z-10 min-w-44 rounded-lg border border-border bg-surface p-3 text-sm shadow-lg"
          style={{
            left: `${(hoveredGeo.cx / map.w) * 100}%`,
            top: `${(hoveredGeo.cy / map.h) * 100}%`,
            transform: "translate(-50%, -115%)",
          }}
        >
          <p className="font-semibold">{hovered.nameMr}</p>
          <p className="mt-1 flex justify-between gap-4 text-xs">
            <span className="text-muted">{lang === "mr" ? "सक्रिय तिकिटे" : "Active tickets"}</span>
            <span className="font-semibold tabular-nums">{hovered.active}</span>
          </p>
          <p className="flex justify-between gap-4 text-xs">
            <span className="text-muted">{lang === "mr" ? "मुदत उलटलेली" : "Overdue"}</span>
            <span className={hovered.overdue > 0 ? "font-semibold text-danger" : "tabular-nums"}>
              {hovered.overdue}
            </span>
          </p>
          <p className="flex justify-between gap-4 text-xs">
            <span className="text-muted">{lang === "mr" ? "पडताळणी प्रलंबित" : "Verifications"}</span>
            <span className="tabular-nums">{hovered.pendingUsers}</span>
          </p>
          <p className="mt-1 text-[10px] text-primary">
            {lang === "mr" ? "क्लिक करा — सविस्तर" : "Click for details"}
          </p>
        </div>
      )}

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--surface-2)" }} />
          {lang === "mr" ? "तिकिटे नाहीत" : "No tickets"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "color-mix(in srgb, var(--primary) 55%, var(--surface-2))" }} />
          {lang === "mr" ? "सक्रिय तिकिटे" : "Active load"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-danger" />
          {lang === "mr" ? "मुदत उलटलेली (SLA)" : "Overdue SLA"}
        </span>
      </div>
    </div>
  );
}
