# Lumen — RAG frontend

Next.js 14 (App Router) + TypeScript + Tailwind. Talks to the FastAPI RAG backend.

## Setup

```bash
cp .env.example .env.local     # point NEXT_PUBLIC_API_URL at your backend
npm install
npm run dev
```

Then open http://localhost:3000

## Routes

- `/login`, `/signup` — email + password auth
- `/auth/callback` — reads OAuth tokens from URL fragment (used by Google login)
- `/chat` — main chat interface (protected)
- `/documents` — upload and manage documents (protected)

## How auth works

- **Access tokens** (short-lived, 30 min) sit in `localStorage` and are sent as `Authorization: Bearer` on every API call.
- **Refresh tokens** (long-lived, 30 days) also sit in `localStorage`. When a request returns 401, `lib/api.ts` auto-refreshes the access token and retries the request once.
- **Google OAuth** redirects to the backend, which finishes the exchange and bounces back to `/auth/callback#access_token=...&refresh_token=...`. Tokens ride in the URL fragment so they never hit backend logs.

## Notes

- All API calls go through `lib/api.ts`, which handles auth headers and refresh automatically.
- The chat and documents pages are wrapped in `<AuthProvider>` which redirects to `/login` if the user isn't authenticated.
- Custom Tailwind palette in `tailwind.config.ts` — tweak `accent`, `bg`, `surface` colors to rebrand.
