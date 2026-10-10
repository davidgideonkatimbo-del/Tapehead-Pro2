import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../www/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
const jobs = fs.readFileSync(new URL('../www/api/jobs.js', import.meta.url), 'utf8');
const cloud = fs.readFileSync(new URL('../www/js/cloud.js', import.meta.url), 'utf8');

test('UI has continuity badges', () => {
  assert.match(html, /id="continuityBadge"/);
  assert.match(html, /id="pcContinuity"/);
  assert.match(app, /function updateContinuityBadge/);
});

test('collab rooms persist continuity', () => {
  assert.match(app, /room\.continuity/);
  assert.match(app, /saveActiveRoom/);
  assert.match(cloud, /row\.continuity\s*=\s*room\.continuity|continuity.*room\.continuity/);
});

test('job processor applies continuity brief and style locks', () => {
  assert.match(jobs, /continuityBrief/);
  assert.match(jobs, /opts\.style/);
  assert.match(jobs, /opts\.bpm/);
});

test('version snapshots include continuity', () => {
  assert.match(app, /continuity: room\.continuity \|\| state\._continuity/);
});
