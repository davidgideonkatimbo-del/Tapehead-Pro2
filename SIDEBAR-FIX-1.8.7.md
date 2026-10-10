# Tapehead Pro 1.8.7 — Menu Bridge Fix

The sidebar open/close path is now handled directly by the hamburger button and overlay HTML controls. The late sidebar JavaScript binder no longer overwrites those handlers. This makes the core menu mechanism independent of unrelated application JavaScript errors.

Also bumps the service-worker cache to v187-menu.
