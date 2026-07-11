# LOC User Portal

Next.js 14 app where registered managers log in and track their standings and payouts.

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev   # runs on :3001
```

## Pages

- `/login` — email/password, backed by the FastAPI custom-JWT `/auth/login`.
- `/dashboard` — current gameweek points, total points, overall rank, and full league standings table (reads from the backend's cached `gameweek_standings_snapshot`, not live FPL).

## Still needed

Payout history view (`GET /payouts` filtered to the logged-in user — backend currently only exposes that admin-scoped; add a `/payouts/me` endpoint), profile/bank-details editing, refresh-token rotation (currently only the access token is used; `loc_refresh_token` is stored but nothing calls a refresh endpoint yet since the backend doesn't have one wired up — add `POST /auth/refresh` when you're ready to handle 30-day sessions properly).
