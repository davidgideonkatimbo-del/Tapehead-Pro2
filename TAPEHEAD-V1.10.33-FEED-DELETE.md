# Tapehead Pro v1.10.34 — Feed Post Delete

## Feed ownership
- Added a Delete action to posts owned by the signed-in user.
- Delete action is hidden for other users' posts.
- Local Feed removes the post immediately after confirmation.
- Cloud deletion is restricted to the authenticated user's `user_id`.
- Associated likes and comments are removed before the post.
- If cloud deletion fails, the post is restored locally and the user is notified.

## Safety
- Uses an explicit confirmation dialog.
- Backend query includes both post ID and authenticated owner ID.
- Other users' posts cannot be deleted through the UI or ownership-scoped cloud call.
