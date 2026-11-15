# Movie Memory (Variant B: Frontend/API-Focused)

Sign in with Google, tell the app your favorite movie, and get fun facts about it from OpenAI.
Stack: Next.js 14 (App Router), React, TailwindCSS, Postgres, Prisma, NextAuth (Google), OpenAI.

## Setup

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # fill in the values below
npx prisma migrate dev --name init   # creates tables (commit prisma/migrations)
npm run dev                      # http://localhost:3000
npm test                         # vitest
```

For production deploys use `npx prisma migrate deploy`.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `NEXTAUTH_URL` | App base URL, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Signs session JWTs (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth "Web application" credentials. Redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google` |
| `OPENAI_API_KEY` | Server-only. Never prefixed `NEXT_PUBLIC_`, so it is never bundled to the browser |
| `OPENAI_BASE_URL` | Optional. Points the OpenAI SDK at a compatible provider, e.g. `https://api.groq.com/openai/v1` |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o-mini` |

### Fact generation provider

Fact generation uses the OpenAI SDK. I ran it through Groq's OpenAI-compatible API (free tier)
by setting `OPENAI_BASE_URL` and `OPENAI_MODEL`. With a real OpenAI key, remove those two
variables and the app defaults to `gpt-4o-mini`. Generated facts are not verified and can be
inaccurate.

## Architecture overview

**Auth flow.** `/` (landing) -> Google -> `/post-login`, a tiny server page that checks the DB: no
favorite movie -> `/onboarding`, otherwise -> `/dashboard`. Logged-in users hitting `/` are sent
through the same route. `/dashboard`, `/onboarding` and `/post-login` are guarded twice: by
`middleware.ts` (redirect to `/`) and by a session check inside each server page. API routes do their own
check and return JSON `401` (not a redirect).

**Sessions.** NextAuth with the Prisma adapter (so `User`/`Account` rows live in Postgres) but
`strategy: "jwt"`, so middleware needs no DB access. The DB user id is placed on `session.user.id`.
Every API handler derives identity from that id only. No endpoint accepts a user id, so one user cannot
read or modify another's data.

**Schema.**
- `User`: NextAuth fields + `favoriteMovie` (nullable). "Onboarded" simply means `favoriteMovie IS NOT NULL`,
  so there is no second flag to drift out of sync. One movie per user, so a column beats a join table.
- `Fact(userId, movie, content, createdAt)` with index `(userId, createdAt)`. Every generated fact is stored.
  `movie` is denormalised deliberately: it records which title the fact was about even after the user changes it.

**API contract** (types in `lib/types.ts`, shared by server and client)

| Endpoint | Success | Errors |
|---|---|---|
| `GET /api/me` | `200 MeResponse` | `401` |
| `PUT /api/me/movie` `{movie}` | `200 MeResponse` | `400 VALIDATION`, `401`, `500` |
| `GET /api/fact` | `200 { fact }` | `401`, `409 NO_MOVIE`, `502 UPSTREAM` |

All errors share one shape: `{ error: { code, message } }`. Responses are `Cache-Control: no-store`.
Input is validated server-side with zod (`trim`, 1-100 chars); the same schema is reused in the forms only for
instant feedback. `/api/fact` reads the movie from the DB, never from the request, and the title is
passed to OpenAI inside delimiters with a system prompt that treats it as data (basic prompt-injection hygiene).
OpenAI calls have a 10s timeout and one retry.

**Typed client** (`lib/api.ts`). One `request<T>()` function; every failure becomes an `ApiError`
(`status`, `code`, `message`): HTTP errors, non-JSON bodies, network failures (`status 0`) and empty bodies.
UI code only ever handles one error type. A `401` on the dashboard redirects to `/`.

**Frontend state.**
- `useMe`: loads `/api/me`; `saveMovie` is the optimistic update. It swaps the title in immediately, then
  either confirms with the server's canonical value or rolls back to the previous value and rethrows.
- `MovieEditor`: inline view/edit with Save/Cancel. On save it closes instantly (optimistic); on failure it
  reopens with the user's draft and an error so they can retry without retyping.
- `useFact` + `lib/factCache.ts`: see below.
- Loading, error and empty states exist for the dashboard, the fact card (skeleton / error + retry / "add a movie"),
  and a missing name, photo or email (initials avatar, email-prefix name fallback).

### Client-side caching strategy

*Choice:* a ~20-line `FactCache` class plus a hook, rather than SWR/React Query. The requirement is one
value with a 30s TTL and explicit invalidation. A data-fetching library would add a dependency and
more to explain than it saves. If the app grew more endpoints I'd switch to React Query.

*Rules:*
1. The cache holds the latest fact with a timestamp and is **keyed by movie**. Even if invalidation were
   missed, a fact for the old title can't be shown for the new one.
2. Within 30s the cached fact is reused (so re-renders and remounts don't spend OpenAI calls). "New fact"
   bypasses the cache.
3. Invalidated on a **successful** movie change (and on logout). It is *not* invalidated on a failed save,
   because the title rolls back and the old fact is still valid.
4. While a save is in flight the fact card shows a skeleton instead of a fact for a title that may be about to change.
5. A request-id guard in `useFact` discards responses that arrive after the movie changed (no stale-response race).

The server always generates a fresh fact on `/api/fact` (allowed by the brief); freshness windows are a client decision.

## Key tradeoffs

- **Column vs. table for the favorite movie.** Column: simpler and matches "one favorite". A table would be
  warranted for multiple favorites or history.
- **JWT sessions** make middleware cheap but mean profile fields (name/photo) are snapshotted in the DB at first sign-in.
- **Client trims + validates, server is the authority.** Duplication is limited to one shared zod schema.
- **No server-side dedupe/rate limit** on `/api/fact`; that belongs to Variant A and is the main abuse risk
  (a logged-in user can spam OpenAI calls). It is the first thing I'd add.
- **Client cache is per tab, in memory.** Simple and correct for the requirement; not shared across tabs.

## With 2 more hours

- Per-user rate limit / short server-side dedupe on `/api/fact`, and fall back to the latest stored fact if OpenAI fails.
- Route-handler integration tests against a test Postgres (authz: user A can't affect user B), plus a Playwright happy-path.
- Stop persisting Google access/refresh tokens in `Account` (not needed) and refresh name/photo on sign-in.
- Movie autocomplete (TMDB) to avoid free-text titles that OpenAI can't recognise.
- Rollback toast instead of reopening the editor; request cancellation with `AbortController`.

## Tests (`npm test`)

- `tests/api.test.ts`: success parsing, 401, 500 with non-JSON body, validation message passthrough, network failure.
- `tests/factCache.test.ts`: 30s boundary, per-movie keying, clear.
- `tests/movie-edit.test.tsx`: optimistic update + cache invalidation, rollback on failure (cache kept), cancel, client validation.

## AI usage note

- Used Claude to scaffold the project and draft the initial code, tests and README.
- I set up Google OAuth, the Neon Postgres database and the Groq API key myself and ran the app locally.
- I debugged the fact feature with Claude: the first Groq model wasn't available on the free plan,
  and the replacement model needed a higher `max_tokens` because it returned empty text.
- I ran the tests (14 passing) and checked login, onboarding, edit and validation in the browser.
- AI-generated code and facts were reviewed by me before submitting.
