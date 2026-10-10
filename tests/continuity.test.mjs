import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../www/js/continuity.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../www/app.js', import.meta.url), 'utf8');
const ai = fs.readFileSync(new URL('../www/api/ai.js', import.meta.url), 'utf8');

function loadC() {
  const sandbox = { window: {}, console };
  vm.runInNewContext(src, sandbox);
  return sandbox.window.TapeheadContinuity;
}

test('continuity module is loaded in index.html', () => {
  assert.match(html, /js\/continuity\.js/);
});

test('snapshot v2 includes rhyme anchors and locks', () => {
  const C = loadC();
  assert.equal(C.version, 2);
  const snap = C.snapshot({
    bpm: 118,
    writeSections: [
      { id: 'verse1', text: 'walk the night alone\nphone lights up the stone' },
      { id: 'chorus', text: 'hold me closer now\nnever let me down' }
    ]
  }, { key: 'Am', mood: 'Night', style: 'amapiano', language: 'English', hook: 'hold me closer now' });
  assert.equal(snap.version, 2);
  assert.equal(snap.bpm, 118);
  assert.equal(snap.key, 'Am');
  assert.equal(snap.style, 'amapiano');
  assert.deepEqual(snap.sectionOrder, ['verse', 'chorus']);
  assert.ok(snap.sectionSummaries[0].rhymeAnchors.length >= 1);
  assert.equal(snap.locks.style, true);
  assert.equal(snap.hook, 'hold me closer now');
});

test('applyLocks and buildBrief keep AI on-brief', () => {
  const C = loadC();
  const snap = C.snapshot({ bpm: 100, writeSections: [] }, { key: 'G', style: 'gospel', language: 'English', mood: 'Faith' });
  const opts = C.applyLocks({ mood: 'Joy' }, snap);
  assert.equal(opts.bpm, 100);
  assert.equal(opts.style, 'gospel');
  assert.equal(opts.key, 'G');
  assert.equal(opts.mood, 'Joy');
  const brief = C.buildBrief(snap, 'polish');
  assert.match(brief, /gospel/i);
  assert.match(brief, /100 BPM/);
  assert.match(brief, /Polish only/);
});

test('attachToSong and restoreFromSong round-trip', () => {
  const C = loadC();
  const state = {
    bpm: 112,
    writeSections: [{ id: 'verse1', text: 'sunrise on the hill\nquiet heart be still' }]
  };
  const song = { title: 'Test', bpm: 112, key: 'C', mood: 'Hope', hook: '' };
  C.attachToSong(song, state, { style: 'afrobeats', language: 'English' });
  assert.ok(song.continuity);
  assert.equal(song.continuity.style, 'afrobeats');
  const state2 = { writeSections: song.sections || state.writeSections };
  const restored = C.restoreFromSong(song, state2);
  assert.equal(restored.style, 'afrobeats');
  assert.equal(state2.bpm, 112);
});

test('suggestNextSection follows song form', () => {
  const C = loadC();
  assert.equal(C.suggestNextSection({ sectionOrder: [] }), 'verse');
  assert.equal(C.suggestNextSection({ sectionOrder: ['verse'] }), 'pre');
  assert.equal(C.suggestNextSection({ sectionOrder: ['chorus'] }), 'bridge');
});

test('app persists and restores continuity; AI sends continuityBrief', () => {
  assert.match(app, /attachToSong/);
  assert.match(app, /restoreFromSong/);
  assert.match(app, /continuityBrief/);
  assert.match(ai, /continuityBrief/);
});
