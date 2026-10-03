# Tapehead Pro — AIR Social Layer

Tapehead Pro can now operate as a multi-user online app when deployed with Supabase.

## What is live across phones

- Cloud accounts using Supabase Auth (email/password)
- Public artist profiles
- Follow / unfollow
- Feed publishing, likes and comments
- Realtime Feed updates
- Private 1-to-1 messages
- Realtime message delivery
- Collaboration rooms with realtime membership/beat updates
- Collaboration room chat/activity

## One-time Supabase setup

1. Open the project's Supabase SQL Editor.
2. Run `www/supabase-schema.sql` if the base tables are not already installed.
3. Run `www/supabase-social.sql` if follows/messages were not already installed.
4. Run `www/supabase-air.sql` once.
5. In Supabase Auth, enable Email/Password.
6. In Authentication → URL Configuration, add your production app URL to the allowed redirect/site URLs.
7. Keep the frontend configured with the Supabase **anon** key only. Never put the `service_role` key in the website.

## Deploy

The supplied `www/cloud-config.js` already contains the project's Supabase URL and anon key. Deploy the complete `www/` folder to the same hosting target used by Tapehead Pro.

For Vercel, keep the existing `/api/ai` deployment so the Write page AI continues to work.

## Phone-to-phone test

1. Deploy the updated `www/` build to your production URL.
2. On Phone A, create a Supabase email/password account and complete email confirmation if your Supabase Auth settings require it.
3. On Phone B, create a different Supabase account.
4. Phone A publishes a Feed post. Refresh/open Feed on Phone B; the post should appear without sharing local storage.
5. From Phone B, open Phone A's artist profile and tap **Follow**. Phone A should see the updated follower relationship when the profile is reopened.
6. From Phone B, tap **Message** and send a message. Phone A should receive it through Supabase Realtime.
7. Create a Collab room on Phone A, join with Phone B using the room code, and send Collab chat messages from both devices.

If a test fails, open the browser/app developer console and look for a Supabase RLS or authentication error; do not disable RLS to fix it.

## Account behavior

Production social features (Feed, follows, messages, collaboration) require a Supabase cloud account. Sign in with email and password so activity syncs across devices.

Phone-number authentication can be enabled later through Supabase Auth without changing the social database model.
