import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const jobsHelper = fs.readFileSync(new URL('../www/api/_jobs.js', import.meta.url), 'utf8');
const jobsApi = fs.readFileSync(new URL('../www/api/jobs.js', import.meta.url), 'utf8');
const sql = fs.readFileSync(new URL('../www/supabase-jobs.sql', import.meta.url), 'utf8');
const ai = fs.readFileSync(new URL('../www/api/ai.js', import.meta.url), 'utf8');

test('jobs SQL has claim function locked to service_role', () => {
  assert.match(sql, /claim_tapehead_job/);
  assert.match(sql, /grant execute on function public\.claim_tapehead_job.*service_role/);
  assert.match(sql, /revoke all on function public\.claim_tapehead_job.*authenticated/);
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /stale worker|15 minutes/);
});

test('job kinds and priorities are defined', () => {
  assert.match(jobsHelper, /ai_generate/);
  assert.match(jobsHelper, /bounce/);
  assert.match(jobsHelper, /export/);
  assert.match(jobsHelper, /JOB_PRIORITIES/);
  assert.match(jobsHelper, /createJob|claimJob|completeJob|failJob/);
});

test('jobs API requires auth for create and scopes status to user', () => {
  assert.match(jobsApi, /getBearerUser/);
  assert.match(jobsApi, /getEntitlement/);
  assert.match(jobsApi, /createJob/);
  assert.match(jobsApi, /getJob\(id, user\.id\)/);
  assert.match(jobsApi, /handleProcess|claimJob/);
});

test('ai.js can queue full_song as durable job', () => {
  assert.match(ai, /createJob/);
  assert.match(ai, /ai_generate/);
  assert.match(ai, /asyncMode|AI_ASYNC_FULL_SONG/);
  assert.match(ai, /202/);
});

test('process endpoint is secret-protected when JOBS_PROCESS_SECRET set', () => {
  assert.match(jobsApi, /JOBS_PROCESS_SECRET|CRON_SECRET/);
});
