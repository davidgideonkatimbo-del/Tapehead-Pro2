# Tapehead Pro v1.10.42 — Feed Profile Tap + Delete Fix

- Feed artist avatars are now direct profile tap targets.
- Artist names remain direct profile tap targets.
- Public profile opens immediately on tap while cloud details load.
- Prevented duplicate profile-open handling between delegated listeners.
- Fixed Feed Delete not firing because the delegated action guard did not include `[data-delete-post]`.
- Delete remains visible only on posts owned by the signed-in artist.
- Cloud deletion uses the existing ownership-scoped delete path.
- Service-worker cache bumped to v11042.
