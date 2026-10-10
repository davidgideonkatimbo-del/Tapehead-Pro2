# Tapehead Pro 1.8.6 — Sidebar isolation fix

Replaced the shared delegated sidebar click controller with an isolated final sidebar bridge using direct element `onclick` handlers. This prevents unrelated click listeners or an earlier JavaScript exception from disabling the sidebar.

Also bumped the service-worker cache and registration query to force the new web shell to update.
