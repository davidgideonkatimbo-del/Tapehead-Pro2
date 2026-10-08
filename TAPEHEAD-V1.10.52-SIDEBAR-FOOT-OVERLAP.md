# Tapehead Pro v1.10.52 — Sidebar footer vs bottom bar

## Problem
With the menu open, lower sidebar actions (Messages, Help, Share, Bounce, Upgrade, Theme)
were covered by the fixed primary bottom navigation. Bottom nav used `z-index: 120` while
the open sidebar was forced to `z-index: 110`.

## Fix
- Sidebar base and `body.menu-open .sidebar` use `z-index: 130` (above bottom nav).
- Overlay raised to `z-index: 125` while the menu is open.
- While menu is open, bottom nav / studio subnav are non-interactive and dimmed.
- Sidebar gets bottom safe-area padding; footer is `flex-shrink: 0` so buttons stay reachable.
- Service worker cache: `tapehead-v11052`. App version: `1.10.52`.
