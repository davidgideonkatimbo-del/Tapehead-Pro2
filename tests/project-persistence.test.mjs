import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../www/project-persistence.js', import.meta.url), 'utf8');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const P = context.globalThis.TapeheadProjectPersistence;

const plain = value => JSON.parse(JSON.stringify(value));

test('project persistence rejects malformed and invalid records', () => {
  assert.deepEqual(plain(P.parseSongs('{bad json')), []);
  assert.deepEqual(plain(P.normalizeSongs([{ title: 'no id' }, null, [], { id: 'p1', title: 'Good' }])), [{ id: 'p1', title: 'Good' }]);
});

test('project serialization preserves the full valid project object', () => {
  const song = { id: 'p1', title: 'Demo', lyrics: 'line', updated: 123, arrangement: { sections: ['A', 'B'] }, mix: { limiter: true } };
  assert.deepEqual(plain(P.parseSongs(P.serializeSongs([song]))), [song]);
  assert.deepEqual(plain(P.snapshot([song])), [song]);
});

test('project merge keeps unique records and selects the newer timestamp', () => {
  const local = [{ id: 'same', title: 'local', updated: 20 }, { id: 'local-only', updated: 10 }];
  const remote = [{ id: 'same', title: 'cloud newer', updated: 21 }, { id: 'cloud-only', updated: 30 }];
  assert.deepEqual(plain(P.mergeProjects(local, remote)), [
    { id: 'cloud-only', updated: 30 },
    { id: 'same', title: 'cloud newer', updated: 21 },
    { id: 'local-only', updated: 10 }
  ]);
});

test('project merge keeps local copy when timestamps tie', () => {
  assert.deepEqual(plain(P.mergeProjects([{ id: 'p', title: 'local', updated: 50 }], [{ id: 'p', title: 'cloud', updated: 50 }])), [{ id: 'p', title: 'local', updated: 50 }]);
});

test('app and cloud layer use persistence module and full project snapshots', () => {
  const app = fs.readFileSync(new URL('../www/app.js', import.meta.url), 'utf8');
  const cloud = fs.readFileSync(new URL('../www/js/cloud.js', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
  assert.match(html, /project-persistence\.js\?v=1\.11\.4/);
  assert.match(app, /TapeheadProjectPersistence/);
  assert.match(cloud, /project_data: s/);
  assert.match(cloud, /snapshot\.updated/);
});

test('AI client supports sync responses and the v1.11 queued-job contract', async () => {
  const clientSource = fs.readFileSync(new URL('../www/ai-job-client.js', import.meta.url), 'utf8');
  const clientWindow = { fetch: null };
  vm.runInNewContext(clientSource, { window: clientWindow, Date, encodeURIComponent, Promise, setTimeout });
  const client = clientWindow.TapeheadAIJobs;
  const sync = await client.submitAndWait({ token: 'test-token', body: { action: 'hook' }, fetchImpl: async () => ({ ok: true, json: async () => ({ text: 'hook text' }) }) });
  assert.equal(sync.text, 'hook text');
  let polls = 0;
  const queued = await client.submitAndWait({
    token: 'test-token', body: { action: 'full_song' }, timeoutMs: 3000, pollMs: 250,
    fetchImpl: async (url) => {
      if (url === '/api/ai') return { ok: true, status: 202, json: async () => ({ async: true, job: { id: 'job-1', status: 'queued' } }) };
      polls += 1;
      return { ok: true, json: async () => ({ job: { id: 'job-1', status: 'succeeded', result: { text: 'full song' } } }) };
    }
  });
  assert.equal(queued.text, 'full song');
  assert.equal(queued.jobId, 'job-1');
  assert.equal(polls, 1);
});
