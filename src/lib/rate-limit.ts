import { headers } from "next/headers";

/**
 * Lightweight in-memory fixed-window rate limiter for Server Actions
 * (USR-1's availability check, USR-6's login attempts). Keyed by client IP
 * + action name, held in a module-level Map for the life of the server
 * process.
 *
 * Known limitation (see docs/scope-addendum-decisions.md): this resets on
 * redeploy and isn't shared across serverless instances/regions, so it's a
 * best-effort deterrent, not a hard guarantee, once this app runs on
 * multiple instances. Upgrade to a shared store (e.g. Upstash Redis) if/when
 * this ships on infrastructure that scales horizontally.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired buckets so the Map doesn't grow unbounded on a
// long-lived process.
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

export async function checkRateLimit(
  action: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  if (buckets.size > 5000) sweep(now);

  const key = `${action}:${await clientKey()}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
