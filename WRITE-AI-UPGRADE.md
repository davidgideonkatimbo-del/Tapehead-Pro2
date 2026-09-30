# Tapehead Pro 1.7.0 — Write Page Upgrade

## What changed

- Reworked the Write-page AI from a static phrase bank into a real Cloud AI workflow.
- Added secure `/api/ai` serverless endpoint so the OpenAI API key stays server-side.
- Added AI actions:
  - Finish Verse
  - Write Next
  - Polish
  - Hook Lab
  - Create Full Song
- Added AI controls for writing style, language and output length.
- Added graceful local songwriting fallback when Cloud AI is briefly unavailable.
- Added AI busy-state handling to prevent double submissions.
- Fixed duplicate AI event handlers that could generate twice or more from one tap.
- Fixed Write-page rebinding on navigation so listeners are not accumulated each time the page is opened.
- Improved next-section behavior so it uses an empty following section or creates one when necessary.
- Improved full-song placement and automatically focuses the first verse after generation.
- Bumped the service-worker cache version to ensure the updated app shell is picked up.

## Cloud AI setup

Set these Vercel environment variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-5.6-sol`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Do not put the OpenAI key in `index.html` or `cloud-config.js`.
