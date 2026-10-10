/* Tapehead Pro project persistence boundary. Keeps the stored project shape intact. */
(function (root) {
  'use strict';
  function normalizeSongs(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(song => song && typeof song === 'object' && !Array.isArray(song) && typeof song.id === 'string' && song.id.trim().length > 0);
  }
  function parseSongs(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return [];
    try { return normalizeSongs(JSON.parse(raw)); } catch (_) { return []; }
  }
  function serializeSongs(value) {
    try { return JSON.stringify(normalizeSongs(value)); } catch (_) { return '[]'; }
  }
  function snapshot(value) {
    return JSON.parse(serializeSongs(value));
  }
  // Merge by stable project id. Newer timestamp wins; local wins ties to avoid
  // overwriting an equally recent in-progress local edit with a cloud copy.
  function mergeProjects(localValue, remoteValue) {
    const local = normalizeSongs(localValue);
    const remote = normalizeSongs(remoteValue);
    const merged = new Map(local.map(song => [song.id, song]));
    for (const song of remote) {
      const current = merged.get(song.id);
      if (!current || Number(song.updated || 0) > Number(current.updated || 0)) merged.set(song.id, song);
    }
    return Array.from(merged.values()).sort((a, b) => Number(b.updated || 0) - Number(a.updated || 0));
  }
  root.TapeheadProjectPersistence = Object.freeze({ normalizeSongs, parseSongs, serializeSongs, snapshot, mergeProjects });
})(typeof window !== 'undefined' ? window : globalThis);
