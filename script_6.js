
/* Tapehead Pro 1.8.6 — isolated sidebar bridge.
   This block intentionally uses element.onclick properties rather than a
   shared delegated click listener. It remains usable even if an unrelated
   earlier script throws an exception. */
(function () {
  function run(fn) {
    try { fn(); }
    catch (err) {
      console.error('[Tapehead] sidebar action error', err);
      try { if (typeof toast === 'function') toast('Please try again.'); } catch (_) {}
    }
  }
  function authOr(fn) {
    if (window.state && state.user) run(fn);
    else run(function () { openAuth('signin'); });
  }
  function bind() {
    var side = document.getElementById('sidebar');
    var toggle = document.getElementById('menuToggle');
    var overlay = document.getElementById('overlay');
    if (!side || !toggle || !overlay) return false;

    /* Menu open/close is handled directly by the HTML controls above.
       Do not overwrite those handlers here. */

    var el;
    el = document.getElementById('newBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ newSong(); closeSidebar(); }); return false; };

    el = document.getElementById('sidebarUser');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ closeSidebar(); authOr(openProfile); }); return false; };

    el = document.getElementById('menuProfileBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ closeSidebar(); authOr(openProfile); }); return false; };

    el = document.getElementById('menuMessagesBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ closeSidebar(); authOr(openMessages); }); return false; };

    el = document.getElementById('menuHelpBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(openHelp); return false; };

    el = document.getElementById('menuShareBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ closeSidebar(); authOr(openPublish); }); return false; };

    el = document.getElementById('menuBounceBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ closeSidebar(); if(!state.user){openAuth('signin');return;} if(typeof doMixdown==='function') doMixdown(); else setView('mix'); }); return false; };

    el = document.getElementById('upgradeBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ closeSidebar(); openPaywall((typeof isPro==='function' && isPro()) ? 'Extend or change your Pro plan.' : 'Upgrade to Pro'); }); return false; };

    el = document.getElementById('themeBtn');
    if (el) el.onclick = function (e) { if(e)e.preventDefault(); run(function(){ setTheme(state.theme === 'dark' ? 'light' : 'dark'); closeSidebar(); }); return false; };

    side.onclick = function (e) {
      var song = e.target && e.target.closest ? e.target.closest('.song-item') : null;
      if (song && side.contains(song)) closeSidebar();
    };
    return true;
  }
  if (!bind()) {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
    window.addEventListener('load', bind, { once: true });
  }
})();
