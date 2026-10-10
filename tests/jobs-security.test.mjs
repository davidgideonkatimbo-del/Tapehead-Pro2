import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.SUPABASE_URL = 'https://sb.test';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
process.env.OPENAI_API_KEY = 'sk-test';
delete process.env.JOBS_PROCESS_SECRET;
delete process.env.CRON_SECRET;

const jobsApi = (await import('../www/api/jobs.js')).default;
const aiApi = (await import('../www/api/ai.js')).default;

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const UID = '11111111-1111-4111-8111-111111111111';

function world({ pro = true, plan = 'month', allowed = true, openJobs = [] } = {}) {
  const w = { jobs: openJobs.map((j, i) => ({ id: 'old' + i, user_id: UID, status: 'queued', created_at: new Date().toISOString(), ...j })), inserts: [], usage: 0, claims: 0, openai: 0, checks: [], completed: [], failed: [] };
  globalThis.fetch = async (url, opts = {}) => {
    url = String(url); const u = new URL(url); const method = opts.method || 'GET';
    if (u.pathname === '/auth/v1/user') return String(opts.headers?.Authorization).includes('tok') ? J({ id: UID }) : J({}, 401);
    if (u.pathname.endsWith('/pro_entitlements')) return J(pro ? [{ plan, status: 'active', expires_at: null }] : []);
    if (u.pathname.endsWith('/rpc/check_ai_usage')) { w.checks.push(JSON.parse(opts.body)); return J(allowed); }
    if (u.pathname.endsWith('/rpc/record_ai_usage')) { w.usage++; w.lastUsageUser = JSON.parse(opts.body).p_user_id; return J(null); }
    if (u.pathname.endsWith('/rpc/claim_tapehead_job')) { w.claims++; const j = w.jobs.find((x) => x.status === 'queued'); if (!j) return J(null); j.status = 'running'; return J(j); }
    if (u.pathname.endsWith('/tapehead_jobs')) {
      if (method === 'GET') { const uid = u.searchParams.get('user_id')?.replace('eq.', ''); const rows = w.jobs.filter((j) => j.user_id === uid && ['queued', 'running'].includes(j.status)); return J(rows.slice(0, Number(u.searchParams.get('limit') || 100)).map((j) => ({ id: j.id }))); }
      if (method === 'POST') { const b = JSON.parse(opts.body); const row = { id: 'new' + (w.inserts.length + 1), created_at: new Date().toISOString(), ...b }; w.inserts.push(row); w.jobs.push(row); return J([row], 201); }
      if (method === 'PATCH') { const b = JSON.parse(opts.body); const id = u.searchParams.get('id')?.replace('eq.', ''); const j = w.jobs.find((x) => x.id === id); Object.assign(j, b); (b.status === 'succeeded' ? w.completed : w.failed).push(id); return J([j]); }
    }
    if (u.host === 'api.openai.com') { w.openai++; return w.openaiFail ? J({ error: { message: 'upstream down' } }, 500) : J({ output_text: 'generated lyrics' }); }
    throw new Error('unexpected fetch ' + url);
  };
  return w;
}
let ipn = 0;
const call = async (handler, { method = 'POST', body = {}, query = {}, headers = {} } = {}) => {
  const res = { code: 0, body: null, headers: {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, setHeader(k, v) { this.headers[k] = v; } };
  await handler({ method, body, query, headers: { authorization: 'Bearer tok', 'x-forwarded-for': '198.51.100.' + (++ipn % 250), ...headers } }, res);
  return res;
};
const create = (payload = { action: 'full_song', prompt: 'rain' }, kind = 'ai_generate', extra = {}) => call(jobsApi, { body: { kind, payload, ...extra } });
const processJobs = (headers = {}) => call(jobsApi, { query: { op: 'process' }, headers });

test('SECURITY: the processor is closed when no secret is configured (it used to run for anyone)', async () => {
  const w = world({ openJobs: [{ kind: 'ai_generate', payload: { action: 'full_song', prompt: 'x' } }] });
  const r = await processJobs({ authorization: '' });
  assert.equal(r.code, 503);
  assert.equal(w.claims, 0);
  assert.equal(w.openai, 0);
});

test('processor: wrong secret is rejected, right secret (either header style, either env var) works', async () => {
  process.env.JOBS_PROCESS_SECRET = 'proc-secret';
  const job = { user_id: UID, kind: 'ai_generate', payload: { action: 'full_song', prompt: 'x' } };
  let w = world({ openJobs: [job] });
  assert.equal((await processJobs({ authorization: 'Bearer nope' })).code, 401);
  assert.equal((await processJobs({ authorization: '' })).code, 401);
  assert.equal(w.claims, 0);
  const ok = await processJobs({ authorization: 'Bearer proc-secret' });
  assert.equal(ok.code, 200);
  assert.equal(ok.body.status, 'succeeded');
  assert.equal(w.openai, 1);

  w = world({ openJobs: [job] });
  assert.equal((await processJobs({ authorization: '', 'x-jobs-secret': 'proc-secret' })).body.status, 'succeeded');

  delete process.env.JOBS_PROCESS_SECRET; process.env.CRON_SECRET = 'cron-secret';
  w = world({ openJobs: [job] });
  assert.equal((await processJobs({ authorization: 'Bearer cron-secret' })).body.status, 'succeeded');
  delete process.env.CRON_SECRET;
});

test('metering: a successful job counts against the owner\'s AI usage; a failed one does not', async () => {
  process.env.JOBS_PROCESS_SECRET = 'proc-secret';
  const job = { user_id: UID, kind: 'ai_generate', payload: { action: 'full_song', prompt: 'x' } };
  let w = world({ openJobs: [job] });
  await processJobs({ authorization: 'Bearer proc-secret' });
  assert.equal(w.usage, 1);
  assert.equal(w.lastUsageUser, UID);

  w = world({ openJobs: [job] }); w.openaiFail = true;
  const r = await processJobs({ authorization: 'Bearer proc-secret' });
  assert.equal(r.body.status, 'failed');
  assert.equal(w.usage, 0);
  delete process.env.JOBS_PROCESS_SECRET;
});

test('create: needs sign-in and Pro, honours the plan-aware hourly limit, and inserts nothing when refused', async () => {
  let w = world();
  assert.equal((await call(jobsApi, { body: { kind: 'ai_generate', payload: { prompt: 'x' } }, headers: { authorization: '' } })).code, 401);
  w = world({ pro: false });
  assert.equal((await create()).code, 403);
  assert.equal(w.inserts.length, 0);

  w = world({ allowed: false });
  const r = await create();
  assert.equal(r.code, 429);
  assert.ok(r.headers['Retry-After']);
  assert.equal(w.inserts.length, 0);
  assert.equal(w.checks[0].p_limit, 45);                       // monthly plan limit comes from aiLimitForPlan
});

test('create: only kinds that have a processor can be created; bad actions are rejected', async () => {
  const w = world();
  for (const kind of ['bounce', 'export', 'stem_render', 'whatever']) assert.equal((await create({ prompt: 'x' }, kind)).code, 400, kind);
  assert.equal((await create({ action: 'delete_all', prompt: 'x' })).code, 400);
  assert.equal((await create({ action: 'polish' })).code, 400);          // needs a prompt
  assert.equal(w.inserts.length, 0);
});

test('create: stores a whitelisted, clamped payload (no smuggled fields, no oversized text) and a server-chosen priority', async () => {
  const w = world();
  const r = await create({ action: 'full_song', prompt: 'p'.repeat(5000), lyrics: 'l'.repeat(50000), result: { text: 'forged' }, status: 'succeeded', evil: 1,
    options: { style: 'rap', bpm: '140', continuityBrief: 'b'.repeat(5000), isAdmin: true } }, 'ai_generate', { priority: 0 });
  assert.equal(r.code, 201);
  const row = w.inserts[0];
  assert.equal(row.payload.prompt.length, 1600);
  assert.equal(row.payload.lyrics.length, 12000);
  assert.equal(row.payload.options.bpm, 140);
  assert.equal(row.payload.options.continuityBrief.length, 1200);
  assert.deepEqual(Object.keys(row.payload).sort(), ['action', 'context', 'hook', 'lyrics', 'options', 'prompt', 'section']);
  assert.equal('isAdmin' in row.payload.options, false);
  assert.equal(row.priority, 5);                                          // client cannot jump the queue
  assert.equal(row.status, 'queued');
  assert.equal(row.result, undefined);
  assert.equal(r.body.job.status, 'queued');
});

test('create: at most 3 unfinished jobs per user; old stuck jobs do not block forever', async () => {
  let w = world({ openJobs: [{}, {}, {}] });
  const r = await create();
  assert.equal(r.code, 429);
  assert.equal(w.inserts.length, 0);
  w = world({ openJobs: [{}, {}] });
  assert.equal((await create()).code, 201);
  const src = fs.readFileSync(new URL('../www/api/_jobs.js', import.meta.url), 'utf8');
  assert.match(src, /created_at=gte/);                                    // only recent unfinished jobs count
});

test('/api/ai: when the job queue is full the request falls back to a normal metered sync call', async () => {
  process.env.AI_ASYNC_FULL_SONG = '1';
  const w = world({ openJobs: [{}, {}, {}] });
  const r = await call(aiApi, { body: { action: 'full_song', prompt: 'rain', options: {} } });
  assert.equal(r.code, 200);
  assert.equal(r.body.text, 'generated lyrics');
  assert.equal(w.inserts.length, 0);
  assert.equal(w.usage, 1);
  delete process.env.AI_ASYNC_FULL_SONG;
});

test('SQL: signed-in users can read their own jobs but can no longer write them (fresh install and hotfix)', () => {
  for (const f of ['supabase-jobs.sql', 'supabase-jobs-hotfix.sql']) {
    const sql = fs.readFileSync(new URL('../www/' + f, import.meta.url), 'utf8');
    assert.match(sql, /revoke insert, update, delete on public\.tapehead_jobs from anon, authenticated/, f);
    assert.match(sql, /grant select on public\.tapehead_jobs to authenticated/, f);
    assert.ok(!/create policy "users insert own jobs"/.test(sql), f);
  }
});

test('SQL hotfix is scoped to tapehead_jobs only and does nothing if that table is absent (safe next to other projects)', () => {
  const sql = fs.readFileSync(new URL('../www/supabase-jobs-hotfix.sql', import.meta.url), 'utf8');
  const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  assert.match(code, /to_regclass\('public\.tapehead_jobs'\) is null/);
  assert.match(code, /return;/);
  const executed = [...code.matchAll(/execute '([^']*(?:''[^']*)*)'/g)].map((m) => m[1]);
  assert.equal(executed.length, 3);
  executed.forEach((stmt) => assert.match(stmt, /public\.tapehead_jobs/));
  // no statement outside the guarded block touches any table
  assert.ok(!/\b(alter|drop|create|truncate|delete|update)\s+(table|function|policy|trigger)\b(?![^;]*tapehead_jobs)/i.test(code.replace(/execute '[^']*'/g, '')));
});
