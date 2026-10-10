# Tapehead Pro 1.8.5 — Sidebar Fix

## Fixed

- Consolidated sidebar actions into one delegated controller.
- Removed overlapping sidebar click/touch handlers.
- Fixed New Project routing.
- Fixed My Profile routing for signed-in and signed-out users.
- Fixed Messages routing.
- Fixed Help & Manual routing.
- Fixed Share to Feed routing.
- Fixed Bounce Song routing.
- Fixed Upgrade to Pro routing.
- Fixed Theme switching.
- Preserved project-row `loadSong()` behavior.
- Preserved top profile-avatar behavior.
- Preserved seven bottom navigation tabs.
- Bumped service-worker cache so deployed clients receive the corrected JavaScript.

## Sidebar actions

| Action | Behavior |
|---|---|
| New Project | Creates a project when signed in; opens sign-in when not signed in |
| My Profile | Opens profile when signed in; opens sign-in otherwise |
| Messages | Opens messages when signed in; opens sign-in otherwise |
| Help & Manual | Opens the manual |
| Share to Feed | Opens publishing when signed in; opens sign-in otherwise |
| Bounce Song | Starts bounce when signed in; opens sign-in otherwise |
| Upgrade to Pro | Opens the Pro paywall |
| Theme | Toggles dark/light mode and closes the sidebar |
| Project rows | Load the selected project and close the sidebar |
