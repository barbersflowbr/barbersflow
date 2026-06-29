<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d19ad1a7-4fdc-4f35-82a8-8683cca9fea3

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill in the required values:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (backend fallback)
   - `SUPABASE_ANON_KEY` (backend fallback)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `APP_URL`

   Notes:
   - Frontend app uses `VITE_*` and `NEXT_PUBLIC_*` variables.
   - The server-side backend also accepts `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. Run the app:
   `npm run dev`

## Useful commands

- Build production app: `npm run build`
- Start built server: `npm run start`
- Run type check: `npm run lint`
