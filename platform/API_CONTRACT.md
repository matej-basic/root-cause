# Platform API contract (v1)

Shared spec for the backend (`platform/api`, Railway) and frontend
(`platform/web`, Vercel). Both sides must conform to this. If either side needs
to change the contract, change this file first.

## Hosting model

- Frontend: Next.js (App Router) on Vercel, origin `WEB_ORIGIN`
  (e.g. `https://root-cause.matejbasic.com`).
- Backend: Fastify on Railway, origin `API_ORIGIN`
  (e.g. `https://root-cause-api.matejbasic.com`), Postgres attached.
- Different origins, so auth uses a **bearer JWT**, not cookies. The frontend
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
  `description` (markdown, how to reach + walkthrough-level hint), `image`
  (published image name students pull in the self-host compose), `flagHash?`
  (sha256 hex of the static flag; nullable = no static flag; ignored when
  `dynamic`), `order` (int), `active` (bool, default true), `dynamic` (bool,
  default false = validated against the user's `Run` flags instead of
  `flagHash`), `createdAt`.
- `Solve`: `id`, `userId`, `challengeId`, `createdAt`. Unique `(userId, challengeId)`.
- `Submission`: `id`, `userId`, `challengeId`, `correct` (bool), `createdAt`.
  Raw flag text is **not** stored. Used for rate-limiting and stats.
- `Run`: `id` (cuid), `userId`, `challengeId`, `flagHash` (sha256 hex of this
  run's per-run flag), `createdAt`, `solvedAt?`. Created by
  `POST /challenges/:slug/run` when a user runs a dynamic challenge locally; the
  raw flag is returned once and never stored. Rows are retained, so any flag the
  user was ever issued for the challenge still validates on submit.
- `ApiKey`: `id` (cuid), `userId`, `hashedKey` (unique, sha256 hex of the raw
  key), `prefix` (first ~11 chars, for display only), `createdAt`,
  `lastUsedAt?`, `revoked` (bool, default false). One active (non-revoked) key
  per user; regenerating revokes the prior key. The raw key is shown once at
  creation and never stored.

Flag check (static, `dynamic = false`): `sha256(submitted.trim()) === challenge.flagHash`.
Flag check (dynamic, `dynamic = true`): `sha256(submitted.trim())` matches the
`flagHash` of any `Run` ever issued to this user for this challenge. Both
case-sensitive. A dynamic challenge with no run issued to the user →
`422 no_run` on submit.

## Self-host flag model

Users run each challenge locally with its docker-compose. A one-shot `flagger`
sidecar authenticates with the user's API key, calls
`POST /challenges/:slug/run` for a per-run flag, and writes it to a shared
volume at `/flag/flag.txt`. The challenge image's entrypoint copies that flag
into the challenge's own flag sink and then execs the original process, so the
app and the exploit are unchanged and no flag is baked into the image. Each
`run` call records a `Run` bound to the user, and `submit` validates against
those runs.

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
→ `200 { user: { id, username, name, avatarUrl }, stats: { points, solves, rank }, apiKey: { exists, prefix? }, solvedChallengeIds: string[], solves: [{ challengeId, solvedAt }] }`
`solves` carries each solve's ISO timestamp (ascending), so the profile can show when each challenge was solved. `rank` is null when the user has no solves. `apiKey.exists` is true only when a non-revoked key exists, and `prefix` is present then; the secret is never returned.

### `POST /me/api-key`  (auth)
Generate a fresh API key for the caller, revoking any existing one. The
plaintext key is returned **once**; only its sha256 hash and a display prefix
are stored.
→ `201 { key: "rc_..." }`

### `GET /challenges`  (auth optional)
→ `200 { challenges: Challenge[] }` where each item is
`{ id, slug, title, cveId, category, difficulty, points, summary, image, dynamic, order, active, solveCount, solved }`.
`solved` is `false` when unauthenticated. `flagHash`, `description` omitted here.

### `GET /challenges/:slug`  (auth optional)
→ `200 { challenge: { ...list fields..., description }, solved } }`
→ `404 { error: "not_found" }`

### `POST /challenges/:slug/run`  (API-key auth)
Auth via `Authorization: Bearer <api-key>` (not the web JWT). Called by the
flagger sidecar. Mints a fresh per-run flag and records a `Run` bound to the
key's user.
→ `200 { runId, flag }`
→ `401 { error: "unauthorized" }` when the key is missing, invalid, or revoked.
→ `404 { error: "not_found" }` when the challenge is unknown, inactive, or not dynamic.
→ `429 { error: "rate_limited" }` per-key ~10/min, plus a daily cap of 100 runs/user/24h.

### `POST /challenges/:slug/submit`  (auth: web JWT only)
Body `{ "flag": "flag{...}" }`. No API-key auth here. Dynamic challenges
validate against the hashes of this user's `Run`s for the challenge; static ones
against `flagHash`.
→ `200 { correct: true, alreadySolved: false, pointsAwarded: 200 }`
→ `200 { correct: false }`
→ `200 { correct: true, alreadySolved: true, pointsAwarded: 0 }`
→ `422 { error: "submissions_disabled" }` when static and `flagHash` is null.
→ `422 { error: "no_run" }` when dynamic and the user has never run it.
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

## Seed challenges

The launch catalog is the four dynamic challenges below. Each mints a per-run
flag, so there is no canonical static flag. Dirty Pipe stays in the repo but
inactive (`active = false`) pending a kernel test on the self-host target; it is
still static and its flag lives in its Dockerfile. ERMS (CVE-2021-44966) is
dropped.

| slug | cveId | title | category | difficulty | points | image | dynamic | active |
|---|---|---|---|---|---|---|---|---|
| zgrep-rce | CVE-2022-1271 | zgrep arbitrary file write | misc | medium | 200 | `matejbasic/cve-2022-1271:1.0` | yes | yes |
| sha3-overflow | CVE-2022-37454 | SHA-3 buffer overflow | crypto | medium | 300 | `matejbasic/cve-2022-37454:1.0` | yes | yes |
| text4shell | CVE-2022-42889 | Text4Shell RCE | web | medium | 300 | `matejbasic/cve-2022-42889:1.0` | yes | yes |
| spring4shell | CVE-2022-22965 | Spring4Shell RCE | web | hard | 400 | `matejbasic/cve-2022-22965:1.0` | yes | yes |
| dirty-pipe | CVE-2022-0847 | Dirty Pipe | pwn | hard | 500 | `matejbasic/cve-2022-0847` | no | no |

Descriptions are drawn from each `CVE-*/README.md` (vulnerability description
plus how the challenge is reached), written for a student about to attempt it,
not a full exploit walkthrough.

## Per-challenge docker-compose

Every challenge ships the same compose shape; only `<slug>` and the challenge
image differ. The flagger sidecar is always the same image.

```yaml
services:
  flagger:
    image: matejbasic/rootcause-flagger:1.0
    environment:
      ROOTCAUSE_API_URL: https://root-cause-api.matejbasic.com
      ROOTCAUSE_API_KEY: ${ROOTCAUSE_API_KEY}
      ROOTCAUSE_CHALLENGE: <slug>
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
  challenge:
    image: <published challenge image>
    depends_on:
      flagger:
        condition: service_completed_successfully
    environment:
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
    ports:
      - "8080:8080"
volumes:
  flag:
```
