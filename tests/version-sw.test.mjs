import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw = fs.readFileSync(new URL('../www/sw.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
const state = fs.readFileSync(new URL('../www/js/state.js', import.meta.url), 'utf8');
const cloud = fs.readFileSync(new URL('../www/js/cloud.js', import.meta.url), 'utf8');

test('service worker cache matches 1.11 modular assets', () => {
  assert.match(sw, /tapehead-v1114/);
  assert.match(sw, /app\.js\?v=1\.11\.4-mod/);
  assert.match(sw, /js\/state\.js/);
  assert.match(sw, /js\/cloud\.js/);
  assert.match(sw, /js\/continuity\.js/);
  assert.ok(!sw.includes('1.10.56'), 'SW must not pin old 1.10.56 shell');
});

test('index app version and SW register are aligned', () => {
  assert.match(html, /data-app-version="1\.11\.4"/);
  assert.match(html, /sw\.js\?v=v1114/);
});

test('scheduleSave uses window bridges (strict-mode safe)', () => {
  assert.match(state, /window\.saveCurrentSong/);
  assert.match(state, /window\.updateProjectContext/);
});

test('cloud vocal upload uses window.toast', () => {
  assert.match(cloud, /window\.toast/);
  assert.ok(!/\btoast\('Choose an audio/.test(cloud.replace(/window\.toast/g, 'SAFE')));
});
