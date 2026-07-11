// Simple in-memory sliding-window rate limiter (per serverless instance).
// Enterprise upgrade: swap for Upstash Redis — same function signature.

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
