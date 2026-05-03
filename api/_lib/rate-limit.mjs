// Simple in-memory rate limiter for Vercel serverless functions.
//
// NOTE: Vercel functions are serverless — each instance has its own Map, so
// this is best-effort protection only. It will NOT prevent a determined
// attacker who triggers cold starts across many instances, but it does block
// the common case of a single client hammering one warm instance.
//
// For production-grade limits we should move this to Upstash Redis or
// Firestore counters. Until then, this is a useful first line of defense.

const buckets = new Map();

// Periodic cleanup so the Map doesn't grow unbounded across requests on a
// long-lived warm instance. Runs lazily on each call rather than via setInterval
// (setInterval keeps the lambda alive and is unreliable in serverless).
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 min

function maybeCleanup(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export function getClientIp(req) {
  const fwd = req.headers && req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    // x-forwarded-for can be a comma-separated list; first entry is the client
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd) && fwd.length > 0) {
    return String(fwd[0]).split(',')[0].trim();
  }
  const real = req.headers && req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real.trim();
  return req.socket && req.socket.remoteAddress ? String(req.socket.remoteAddress) : 'unknown';
}

/**
 * Check whether a request is within rate limits.
 *
 * @param {object} req      Vercel/Node request (used only if `key` doesn't already include an identifier)
 * @param {string} key      Bucket key, e.g. "claim:<uid>" or "ref:<ip>"
 * @param {number} max      Max allowed hits within the window
 * @param {number} windowMs Window duration in ms
 * @returns {{ ok: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRate(req, key, max, windowMs) {
  const now = Date.now();
  maybeCleanup(now);

  if (typeof key !== 'string' || key.length === 0) {
    // Fail-open with a synthetic key so callers don't crash; still useful as
    // a per-IP fallback.
    key = 'unknown:' + getClientIp(req);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, retryAfterMs: 0 };
}

// Exposed for tests / introspection only — do not use in business logic.
export function _resetForTests() {
  buckets.clear();
  lastCleanup = Date.now();
}
