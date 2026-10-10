import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../www/', import.meta.url);
const app = fs.readFileSync(new URL('app.js', root), 'utf8');
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const cloud = fs.readFileSync(new URL('js/cloud.js', root), 'utf8');
const state = fs.readFileSync(new URL('js/state.js', root), 'utf8');

test('cloud and state modules exist and expose globals', () => {
  assert.match(cloud, /window\.TapeheadCloud\s*=/);
  assert.match(state, /window\.state\s*=/);
  assert.match(state, /window\.scheduleSave\s*=/);
});

test('index loads modules before app.js', () => {
  const iState = html.indexOf('js/state.js');
  const iCloud = html.indexOf('js/cloud.js');
  const iApp = html.indexOf('app.js?v=');
  assert.ok(iState > 0 && iCloud > 0 && iApp > 0);
  assert.ok(iState < iCloud && iCloud < iApp, 'load order must be state → cloud → app');
});

test('app.js uses external Cloud with fallback', () => {
  assert.match(app, /window\.TapeheadCloud/);
  assert.match(app, /Cloud module missing|TapeheadCloud module missing/);
  assert.ok(!app.includes('/* ── Phase C: Cloud layer (Supabase) with local fallback ── */'));
});

test('app.js no longer inlines the full Cloud object body', () => {
  // Original Cloud started with sb: null, mode: 'local' inside const Cloud
  assert.ok(!/const Cloud = \{\s*sb:\s*null,\s*mode:\s*'local'/.test(app));
});
