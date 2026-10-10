import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app = fs.readFileSync(new URL('../www/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');

test('Write premium layer is defined, exposed to later scripts, and called', () => {
  assert.match(app, /function bindWritePremiumUI\(\)/);
  assert.match(app, /Object\.assign\(window,\{bindWritePremiumUI,/);
  assert.match(html, /bindWritePremiumUI\(\);/);
});

test('every premium Write control in the markup has a handler', () => {
  for (const id of ['duplicateSectionBtn','renameSectionBtn','moveSectionUpBtn','moveSectionDownBtn','deleteSectionBtn','focusWriteBtn','saveIdeaBtn']) {
    assert.ok(html.includes(`id="${id}"`), `markup missing ${id}`);
    assert.ok(app.includes(`$('${id}')`) || app.includes(`getElementById('${id}')`), `no handler bound for ${id}`);
  }
});

test('later scripts can reach the main-scope helpers they call', () => {
  for (const fn of ['thRes','buildTracks','saveCurrentSong','persistSongs','renderSongList','makeStableId']) {
    assert.match(app, new RegExp(`Object\\.assign\\(window,\\{[^}]*\\b${fn}\\b`), `${fn} not bridged`);
  }
});

test('main script is external and cache-revalidated', () => {
  assert.match(html, /<script src="app\.js\?v=/);
  const v = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.match(JSON.stringify(v), /app\\\\\.js/);
});
