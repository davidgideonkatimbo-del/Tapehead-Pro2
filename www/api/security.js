/** Shared server-side security helpers for Tapehead API routes. */

const ipBuckets = new Map(); // ip -> { count, resetAt }

export function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/** Simple in-memory IP rate limit (per serverless instance). */
export function rateLimitIp(req, { limit = 60, windowMs = 60_000 } = {}) {
  const ip = clientIp(req);
  const now = Date.now();
  let b = ipBuckets.get(ip);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    ipBuckets.set(ip, b);
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000), ip };
  }
  return { ok: true, remaining: limit - b.count, ip };
}

export function clean(v, max = 12000) {
  return String(v || '').replace(/\u0000/g, '').trim().slice(0, max);
}

/** Plan-aware AI hourly limits. */
export function aiLimitForPlan(plan) {
  const p = String(plan || 'trial').toLowerCase();
  if (p === 'lifetime' || p === 'year' || p === 'yearly') return 60;
  if (p === 'month' || p === 'monthly') return 45;
  if (p === 'trial') return 20;
  return 15;
}

export const ALLOWED_AI_ACTIONS = new Set([
  'finish_verse', 'next_section', 'polish', 'hook', 'full_song'
]);
