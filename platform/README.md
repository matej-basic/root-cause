# Root Cause platform

A hosted CTF platform for the challenge set in this repo. Two live services:
a Next.js front end on Vercel and a Fastify API on Railway backed by Postgres,
with a contract-first spec that both conform to. Sign-in is one click with
GitHub, flags are mint-per-run and checked against your own account, and there
is a points leaderboard.

- Play: https://root-cause.matejbasic.com
- API: https://root-cause-api.matejbasic.com

## Architecture

```
Browser ──> Next.js app (Vercel)  ──HTTPS──>  Fastify API (Railway) ──> Postgres
             platform/web                      platform/api
```

The API owns the GitHub OAuth flow and the database. After GitHub authorizes a
user, the API signs a short-lived JWT and hands it to the web app in the URL
fragment; the web app sends it back as a bearer token on later requests. The
web app (`root-cause.matejbasic.com`) and the API (`root-cause-api.matejbasic.com`)
are different origins on the same site. Nothing relies on that: auth uses no
cookies, so it would behave the same if the two ran on unrelated domains.

A second credential path exists for the self-host flow. From the profile page a
user mints an API key, stored only as a SHA-256 hash plus a short display
prefix. The `flagger` sidecar sends that key to `POST /challenges/:slug/run`,
which mints a per-run flag bound to the user and returns it to be written into
the locally running challenge. Flag submission itself stays web-JWT only.

`API_CONTRACT.md` is the single source of truth for the endpoints and data
shapes. Change it first if the contract needs to move.

## What it does

- A catalog of the live challenges, each with its CVE, category, difficulty,
  points, and a student-facing brief drawn from the challenge README.
- GitHub OAuth login. No passwords are stored.
- API keys for the self-host CLI and sidecar, shown once and stored only as a
  hash.
- Flag submission with server-side checking. The platform stores only the
  SHA-256 hash of each flag, never the flag itself, and a dynamic flag is
  matched against the runs issued to that user.
- A points leaderboard, ranked by score and then by who reached it first.
- A profile showing your solves and when you landed them.

## Layout

- `platform/web` — Next.js (App Router) + Tailwind. Landing page, challenge
  catalog with filters, challenge detail with flag submission, leaderboard,
  profile. See its own notes inline.
- `platform/api` — Fastify + Prisma + Postgres. OAuth, challenges, submission,
  leaderboard, and an idempotent seed. See `platform/api/README.md`.
- `API_CONTRACT.md` — the shared contract.

## Local development

Two terminals. The API listens on 4000, the web app on 3000.

```bash
# API (needs a Postgres reachable via DATABASE_URL)
cd platform/api
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET at least
npm run dev

# Web
cd platform/web
npm install
npm run dev            # NEXT_PUBLIC_API_URL defaults to http://localhost:4000
```

GitHub login needs an OAuth app whose callback points at the API. For local
work, register one with callback `http://localhost:4000/auth/github/callback`
and set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `platform/api/.env`.

## Deployment

- Railway runs `platform/api` from its `Dockerfile` (service root directory set
  to `platform/api`). It attaches a Postgres plugin, runs `prisma db push` and
  the seed on start, then serves. Env: `DATABASE_URL`, `JWT_SECRET`, `PORT`,
  `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, `WEB_ORIGIN`.
- Vercel runs `platform/web` (project root directory set to `platform/web`,
  framework Next.js). Env: `NEXT_PUBLIC_API_URL` pointing at the Railway API.
- Both redeploy automatically on push to `main`.

## Notes

- The launch catalog is the four app-level challenges (zgrep-rce, spring4shell,
  sha3-overflow, text4shell), all dynamic. Each issues a per-run flag through
  the sidecar rather than carrying a static one.
- Dirty Pipe (CVE-2022-0847) stays in the repo but inactive, pending a kernel
  test. The ERMS challenge (CVE-2021-44966) is dropped from the launch set.
