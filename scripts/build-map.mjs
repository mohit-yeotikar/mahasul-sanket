// Converts the 12.9MB GeoJSON into compact pre-projected SVG paths
// (src/features/dashboard/maharashtra-map.json). Run once:
//   node scripts/build-map.mjs

import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";

const SRC = new URL("../public/maharashtra-districts.geojson", import.meta.url);
const OUT = new URL("../src/features/dashboard/maharashtra-map.json", import.meta.url);

// GeoJSON dtname → our districts.code (from migrations 0006/0009)
const NAME_TO_CODE = {
  "Mumbai": "MUM", "Mumbai Suburban": "MSU", "Thane": "THN", "Palghar": "PAL",
  "Raigarh": "RGD", "Ratnagiri": "RTN", "Sindhudurg": "SIN",
  "Pune": "PUN", "Satara": "SAT", "Sangli": "SGL", "Solapur": "SOL", "Kolhapur": "KOL",
  "Nashik": "NSK", "Dhule": "DHU", "Nandurbar": "NDB", "Jalgaon": "JLG", "Ahmadnagar": "AHM",
  "Aurangabad": "AUR", "Jalna": "JAL", "Parbhani": "PBN", "Hingoli": "HIN",
  "Bid": "BED", "Nanded": "NND", "Latur": "LAT", "Osmanabad": "DSV",
  "Amravati": "AMR", "Akola": "AKL", "Washim": "WSM", "Buldana": "BUL", "Yavatmal": "YVT",
  "Nagpur": "NAG", "Wardha": "WRD", "Bhandara": "BHN", "Gondiya": "GND",
  "Chandrapur": "CHN", "Gadchiroli": "GAD",
};

const geo = JSON.parse(readFileSync(SRC, "utf8"));

// bounds
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
const eachPoint = (coords, fn) => {
  if (typeof coords[0] === "number") fn(coords);
  else coords.forEach((c) => eachPoint(c, fn));
};
for (const f of geo.features) {
  eachPoint(f.geometry.coordinates, ([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  });
}
const W = 720;
const scale = W / (maxX - minX);
const H = Math.round((maxY - minY) * scale);
const px = ([x, y]) => [
  Math.round((x - minX) * scale * 10) / 10,
  Math.round((maxY - y) * scale * 10) / 10, // flip Y for SVG
];

// Douglas-Peucker simplification in pixel space
function dp(points, eps) {
  if (points.length < 3) return points;
  const [sx, sy] = points[0], [ex, ey] = points[points.length - 1];
  let maxD = 0, idx = 0;
  const dx = ex - sx, dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < points.length - 1; i++) {
    const d = Math.abs(dy * points[i][0] - dx * points[i][1] + ex * sy - ey * sx) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [points[0], points[points.length - 1]];
  return [...dp(points.slice(0, idx + 1), eps).slice(0, -1), ...dp(points.slice(idx), eps)];
}

function ringToPath(ring) {
  const raw = ring.map(px);
  // Closed rings (first == last) degenerate the DP baseline — split at the
  // farthest point from the start and simplify the two halves separately.
  const closed =
    raw.length > 3 &&
    raw[0][0] === raw[raw.length - 1][0] &&
    raw[0][1] === raw[raw.length - 1][1];
  let pts;
  if (closed) {
    let far = 1, maxD = -1;
    for (let i = 1; i < raw.length - 1; i++) {
      const d = Math.hypot(raw[i][0] - raw[0][0], raw[i][1] - raw[0][1]);
      if (d > maxD) { maxD = d; far = i; }
    }
    pts = [
      ...dp(raw.slice(0, far + 1), 0.8).slice(0, -1),
      ...dp(raw.slice(far), 0.8).slice(0, -1),
    ];
  } else {
    pts = dp(raw, 0.8);
  }
  if (pts.length < 3) return "";
  return "M" + pts.map(([x, y]) => `${x} ${y}`).join("L") + "Z";
}

const districts = geo.features.map((f) => {
  const name = f.properties.dtname;
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = "";
  let cx = 0, cy = 0, n = 0;
  for (const poly of polys) {
    for (const ring of poly) {
      d += ringToPath(ring);
    }
    // centroid approx from outer ring
    for (const p of poly[0]) {
      const [x, y] = px(p); cx += x; cy += y; n++;
    }
  }
  return {
    code: NAME_TO_CODE[name] ?? name,
    name,
    d,
    cx: Math.round(cx / n),
    cy: Math.round(cy / n),
  };
});

writeFileSync(OUT, JSON.stringify({ w: W, h: H, districts }));
console.log(`map built: ${districts.length} districts, viewBox 0 0 ${W} ${H}`);
console.log(`size: ${(JSON.stringify({ w: W, h: H, districts }).length / 1024).toFixed(0)} KB`);
const unmatched = districts.filter((d) => d.code === d.name);
if (unmatched.length) console.warn("UNMATCHED:", unmatched.map((d) => d.name).join(", "));

// remove the huge source file — but only after a sane build
const emptyPaths = districts.filter((d) => !d.d).length;
if (emptyPaths > 0) {
  console.error(`ABORT: ${emptyPaths} districts have empty paths — keeping source file`);
  process.exit(1);
}
if (existsSync(SRC)) { unlinkSync(SRC); console.log("removed 12.9MB source geojson"); }
