# Tapehead Pro v1.10.21 — Persistent Bottom Navigation

## Navigation behavior
- Bottom navigation is fixed to the viewport instead of participating in page scrolling.
- Write, Studio, Feed, and Collab remain reachable while scrolling.
- Safe-area padding is preserved for iPhone-style home indicators.
- Scrollable views have extra bottom clearance so the navigation bar does not cover the final controls/content.
- Desktop fixed navigation tracks the app's 920px / 1080px content width.
- Existing active-state logic remains unchanged: Beat, Keys, Record, and Mix activate the Studio tab.

## QA
- Existing navigation click handlers preserved.
- JavaScript syntax checked after patch.
