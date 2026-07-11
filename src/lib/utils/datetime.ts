// Deterministic date/time helpers — identical output on server and client
// (no Intl locale data), so they never cause hydration mismatches.

const MR_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toMarathiDigits(s: string): string {
  return s.replace(/\d/g, (d) => MR_DIGITS[Number(d)]);
}

/** DD/MM/YYYY — deterministic. Optionally in Marathi digits. */
export function formatDate(iso: string | Date, lang: "mr" | "en" = "mr"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  const out = `${dd}/${mm}/${yyyy}`;
  return lang === "mr" ? toMarathiDigits(out) : out;
}

/** DD/MM HH:MM — deterministic short date-time. */
export function formatDateTime(iso: string | Date, lang: "mr" | "en" = "mr"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const out = `${dd}/${mm} ${hh}:${min}`;
  return lang === "mr" ? toMarathiDigits(out) : out;
}

/** Whole days from now until `iso` (negative = past). Uses UTC midnight-safe math. */
export function daysUntil(iso: string | Date): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
