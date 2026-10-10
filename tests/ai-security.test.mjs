import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// security.js is ESM - dynamic import
const security = await import('../www/api/security.js');

test('aiLimitForPlan is plan-aware and bounded', () => {
  assert.equal(security.aiLimitForPlan('trial'), 20);
  assert.equal(security.aiLimitForPlan('month'), 45);
  assert.equal(security.aiLimitForPlan('year'), 60);
  assert.equal(security.aiLimitForPlan('lifetime'), 60);
  assert.ok(security.aiLimitForPlan('unknown') <= 30);
});

test('ALLOWED_AI_ACTIONS is a strict allowlist', () => {
  assert.ok(security.ALLOWED_AI_ACTIONS.has('finish_verse'));
  assert.ok(security.ALLOWED_AI_ACTIONS.has('full_song'));
  assert.ok(!security.ALLOWED_AI_ACTIONS.has('delete_all'));
  assert.ok(!security.ALLOWED_AI_ACTIONS.has(''));
});

test('clean strips null bytes and truncates', () => {
  assert.equal(security.clean('hello\u0000world', 20), 'helloworld');
  assert.equal(security.clean('x'.repeat(100), 10).length, 10);
});

test('rateLimitIp eventually blocks', () => {
  const req = { headers: { 'x-forwarded-for': '203.0.113.50' } };
  let blocked = false;
  for (let i = 0; i < 50; i++) {
    const r = security.rateLimitIp(req, { limit: 5, windowMs: 60_000 });
    if (!r.ok) { blocked = true; break; }
  }
  assert.ok(blocked);
});

test('ai.js uses shared Pro helpers and records usage only after success', () => {
  const src = fs.readFileSync(new URL('../www/api/ai.js', import.meta.url), 'utf8');
  assert.match(src, /getBearerUser/);
  assert.match(src, /getEntitlement/);
  assert.match(src, /rateLimitIp/);
  assert.match(src, /aiLimitForPlan/);
  assert.match(src, /recordUsage/);
  // Usage must be recorded after successful response, not before OpenAI call
  const recordIdx = src.indexOf('await recordUsage');
  const openaiIdx = src.indexOf('api.openai.com');
  assert.ok(openaiIdx > 0 && recordIdx > openaiIdx, 'recordUsage must come after OpenAI call');
  assert.match(src, /Do NOT record usage on upstream failure|recordUsage\(user\.id\)/);
});

test('ai usage v2 SQL is service_role only for check/record', () => {
  const sql = fs.readFileSync(new URL('../www/supabase-ai-usage-v2.sql', import.meta.url), 'utf8');
  assert.match(sql, /check_ai_usage/);
  assert.match(sql, /record_ai_usage/);
  assert.match(sql, /grant execute on function public\.check_ai_usage.*service_role/);
  assert.match(sql, /auth\.uid\(\) is null|service_role|caller is null/i);
});
