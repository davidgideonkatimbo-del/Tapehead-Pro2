# Tapehead Pro v1.10.29 — Bottom Navigation Repair

## Fixed
- Removed malformed CSS that had been appended after `</html>` and rendered as visible page text.
- Moved the bottom navigation fix into a valid `<style>` block inside `<head>`.
- Restored fixed viewport positioning for mobile navigation.
- Preserved safe-area padding and responsive desktop widths.
- Bumped app/service-worker cache version to 1.10.29 / v11029.

## QA
- No raw bottom-navigation CSS remains after `</html>`.
- Bottom navigation CSS is contained inside the document head.
