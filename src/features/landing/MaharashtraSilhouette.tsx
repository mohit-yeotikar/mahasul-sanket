"use client";

// Faint Maharashtra state silhouette for the hero backdrop. Reuses the real
// 36-district geometry from the officer-app choropleth (no new data), rendered
// as a single flat fill via currentColor so callers control the tint/opacity.

import MAP from "@/features/dashboard/maharashtra-map.json";

const map = MAP as { w: number; h: number; districts: { d: string }[] };

export function MaharashtraSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${map.w} ${map.h}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      focusable="false"
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="0.75">
        {map.districts.map((d, i) => (
          <path key={i} d={d.d} />
        ))}
      </g>
    </svg>
  );
}
