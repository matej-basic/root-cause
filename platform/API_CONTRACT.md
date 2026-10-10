# Platform API contract (v1)

Shared spec for the backend (`platform/api`, Railway) and frontend
(`platform/web`, Vercel). Both sides must conform to this. If either side needs
to change the contract, change this file first.

## Hosting model

- Frontend: Next.js (App Router) on Vercel, origin `WEB_ORIGIN`
  (e.g. `https://root-cause-ctf.vercel.app`).
- Backend: Fastify on Railway, origin `API_ORIGIN`
  (e.g. `https://root-cause-production-3c05.up.railway.app`), Postgres attached.
- Different domains, so auth uses a **bearer JWT**, not cookies. The frontend
  stores the token and sends `Authorization: Bearer <jwt>` on authenticated
  requests. No third-party cookies.

## Auth flow (GitHub OAuth, backend-owned)

1. Frontend "Sign in with GitHub" navigates the browser to
   `GET {API}/auth/github` (full page redirect, not fetch).
2. Backend 302 → GitHub authorize URL with `state` (random, verified on return).
3. GitHub → `GET {API}/auth/github/callback?code&state`.
4. Backend exchanges `code` for a GitHub access token, reads the GitHub user,
   upserts a `User`, signs a JWT (HS256, `JWT_SECRET`, ~7 day expiry), then
   302 → `{WEB}/auth/callback#token=<jwt>`.
   Token is in the URL **fragment** so it is never sent to any server or logged.
5. Frontend route `/auth/callback` reads `location.hash`, stores the token,
   strips the hash, and redirects into the app.

JWT payload: `{ sub: userId, gh: githubId, username, name, avatarUrl, iat, exp }`.

## Data model (Prisma / Postgres)

- `User`: `id` (cuid), `githubId` (unique string), `username`, `name?`,
  `avatarUrl?`, `createdAt`.
- `Challenge`: `id`, `slug` (unique), `title`, `cveId`, `category`
  (`web` | `pwn` | `crypto` | `misc`), `difficulty`
  (`easy` | `medium` | `hard`), `points` (int), `summary` (short),
  `description` (markdown, how to reach + walkthrough-level hint), `flagHash?`
  (sha256 hex of the flag, nullable = submissions not yet enabled), `order`
  (int), `active` (bool, default true), `createdAt`.
- `Solve`: `id`, `userId`, `challengeId`, `createdAt`. Unique `(userId, challengeId)`.
- `Submission`: `id`, `userId`, `challengeId`, `correct` (bool), `createdAt`.
  Raw flag text is **not** stored. Used for rate-limiting and stats.

Flag check: `sha256(submitted.trim()) === challenge.flagHash` (case-sensitive).

## Endpoints

All JSON. Auth = requires `Authorization: Bearer <jwt>`; 401 if missing/invalid.

### `GET /health`
→ `200 { "ok": true, "time": "<iso>" }`

### `GET /auth/github`  (browser redirect, not fetch)
→ `302` to GitHub.

### `GET /auth/github/callback`  (browser redirect)
→ `302` to `{WEB}/auth/callback#token=...` on success, or
`{WEB}/auth/callback#error=<code>` on failure.

### `GET /me`  (auth)
→ `200 { user: { id, username, name, avatarUrl }, stats: { points, solves, rank }, solvedChallengeIds: string[], solves: [{ challengeId, solvedAt }] }`
`solves` carries each solve's ISO timestamp (ascending), so the profile can show when each challenge was solved. `rank` is null when the user has no solves.

### `GET /challenges`  (auth optional)
→ `200 { challenges: Challenge[] }` where each item is
`{ id, slug, title, cveId, category, difficulty, points, summary, order, active, solveCount, solved }`.
`solved` is `false` when unauthenticated. `flagHash`, `description` omitted here.

### `GET /challenges/:slug`  (auth optional)
→ `200 { challenge: { ...list fields..., description }, solved } }`
→ `404 { error: "not_found" }`

### `POST /challenges/:slug/submit`  (auth)
Body `{ "flag": "flag{...}" }`.
→ `200 { correct: true, alreadySolved: false, pointsAwarded: 200 }`
→ `200 { correct: false }`
→ `200 { correct: true, alreadySolved: true, pointsAwarded: 0 }`
→ `422 { error: "submissions_disabled" }` when `flagHash` is null.
→ `429 { error: "rate_limited" }` (submit limit, e.g. 10/min/user).

### `GET /leaderboard`  (public)
→ `200 { leaderboard: [{ rank, userId, username, avatarUrl, points, solves, lastSolveAt }] }`
Ranking: `points` desc, then earliest `lastSolveAt` first (earlier finish wins),
then `username` asc. Users with zero solves are excluded.

## Errors

JSON `{ error: "<snake_case_code>", message?: string }` with appropriate status.
CORS: allow `WEB_ORIGIN`, methods GET/POST/OPTIONS, header `Authorization`,
`Content-Type`. No credentials (bearer token, not cookies).

## Env vars

Backend: `DATABASE_URL`, `JWT_SECRET`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` (= `{API}/auth/github/callback`),
`WEB_ORIGIN`, `PORT` (Railway-provided).
Frontend: `NEXT_PUBLIC_API_URL` (= `API_ORIGIN`).

## Seed challenges (6)

Flags are sha256-hashed at seed time; raw flags live only in the challenge
Dockerfiles. `challenge_N` is the deployment numbering (see repo CLAUDE.md).

| slug | cveId | title | category | difficulty | points | flag (raw) |
|---|---|---|---|---|---|---|
| erms-sqli | CVE-2021-44966 | ERMS SQL injection auth bypass | web | easy | 100 | (unknown — external image; flagHash null, submissions disabled) |
| dirty-pipe | CVE-2022-0847 | Dirty Pipe | pwn | hard | 500 | `flag{Pipes_usually_arent_dirty}` |
| zgrep-rce | CVE-2022-1271 | zgrep arbitrary file write | misc | medium | 200 | `flag{Shell_scripts_are_awesome_but_also_very_dangerous}` |
| spring4shell | CVE-2022-22965 | Spring4Shell RCE | web | hard | 400 | `flag{Java_being_vulnerable_who_would_have_thought}` |
| sha3-overflow | CVE-2022-37454 | SHA-3 buffer overflow | crypto | medium | 300 | `flag{Congrats_it_was_a_buffer_overflow_vulnerability}` |
| text4shell | CVE-2022-42889 | Text4Shell RCE | web | medium | 300 | `flag{Mistakes_like_text_4_shell_are_unacceptable}` |

Descriptions should be drawn from each `CVE-*/README.md` (vulnerability
description + how the challenge is reached), written for a student about to
attempt it — not a full exploit walkthrough.
