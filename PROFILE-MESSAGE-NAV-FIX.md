# Tapehead Pro v1.8.1 — Profile, Messaging & Navigation Fix

- Cloud profile data is loaded before opening Profile.
- Profile saves now report cloud failures instead of silently closing.
- Profile avatar uploads are resized and synced to Supabase when signed in.
- Public profiles normalize Supabase `open_to_collab` / avatar fields.
- Cloud messaging requires a real Supabase UUID and no longer silently falls back to local storage.
- Message read state calls the Supabase RPC when available.
- Removed overlapping sidebar mobile handlers.
- Collab moved from the sidebar to the persistent bottom navigation.
- Bottom navigation: Write, Beat, Record, Feed, Collab.
