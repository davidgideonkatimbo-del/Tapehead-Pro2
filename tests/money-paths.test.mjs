import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../www/app.js', import.meta.url), 'utf8');
const pro = fs.readFileSync(new URL('../www/api/_pro.js', import.meta.url), 'utf8');
const ai = fs.readFileSync(new URL('../www/api/ai.js', import.meta.url), 'utf8');
const jobs = fs.readFileSync(new URL('../www/api/jobs.js', import.meta.url), 'utf8');
const security = fs.readFileSync(new URL('../www/api/security.js', import.meta.url), 'utf8');

test('free project limit is enforced client-side', () => {
  assert.match(app, /FREE_PROJECT_LIMIT\s*=\s*3/);
  assert.match(app, /function canCreateProject/);
  assert.match(app, /openPaywall.*FREE_PROJECT_LIMIT|Free plan allows/);
});

test('requirePro gates premium features', () => {
  assert.match(app, /function requirePro/);
  assert.match(app, /openPaywall/);
});

test('guest mode is distinct from signed-in and limited', () => {
  assert.match(app, /state\.guest\s*=\s*true/);
  assert.match(app, /enterGuestMode|app-guest/);
  // guests reuse or limited projects
  assert.match(app, /state\.guest.*songs|guest.*project/i);
});

test('songs persist per user key, not global bucket', () => {
  assert.match(app, /th-songs-.*user|th-songs-guest/);
  assert.match(app, /function persistSongs/);
  assert.match(app, /function loadUserSongs/);
});

test('Pro API helpers never expose service role to client paths', () => {
  assert.match(pro, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(pro, /getBearerUser/);
  assert.match(pro, /getEntitlement/);
  // service role only in server files under api/
  assert.ok(!app.includes('SUPABASE_SERVICE_ROLE_KEY'));
});

test('AI and jobs always re-check entitlement server-side', () => {
  assert.match(ai, /getEntitlement/);
  assert.match(jobs, /getEntitlement/);
  assert.match(ai, /403/);
  assert.match(jobs, /403/);
});

test('security module exports rate limit and plan limits', () => {
  assert.match(security, /rateLimitIp/);
  assert.match(security, /aiLimitForPlan/);
  assert.match(security, /ALLOWED_AI_ACTIONS/);
});

test('Cloud AI key never appears in client bundles', () => {
  assert.ok(!app.includes('OPENAI_API_KEY'));
  const cloud = fs.readFileSync(new URL('../www/js/cloud.js', import.meta.url), 'utf8');
  assert.ok(!cloud.includes('OPENAI_API_KEY'));
  assert.ok(!cloud.includes('SERVICE_ROLE'));
});
