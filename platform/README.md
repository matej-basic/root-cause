# Root Cause platform

A hosted CTF platform for the challenge set in this repo. Pick a challenge,
exploit the real CVE, submit the flag, and climb a points leaderboard. Sign-in
is one click with GitHub.

- Play: https://root-cause-ctf.vercel.app
- API: https://root-cause-production-3c05.up.railway.app

## What it does

- A catalog of the six course challenges, each with its CVE, category,
  difficulty, points, and a student-facing brief drawn from the challenge README.
- GitHub OAuth login. No passwords are stored.
- Flag submission with server-side checking. The platform stores only the
  SHA-256 hash of each flag, never the flag itself.
- A points leaderboard, ranked by score and then by who reached it first.
- A profile showing your solves and when you landed them.

## Architecture

```
Browser ──> Next.js app (Vercel)  ──HTTPS──>  Fastify API (Railway) ──> Postgres
             platform/web                      platform/api
```

The API owns the GitHub OAuth flow and the database. After GitHub authorizes a
user, the API signs a short-lived JWT and hands it to the web app in the URL
fragment; the web app sends it back as a bearer token on later requests. There
are no cross-site cookies, so the split between `*.vercel.app` and
`*.up.railway.app` stays reliable.

`API_CONTRACT.md` is the single source of truth for the endpoints and data
shapes. Change it first if the contract needs to move.

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

- The ERMS challenge (CVE-2021-44966) runs from an external image whose flag is
  not known here, so its submissions are disabled and it shows as such.
- Flags are static per challenge. A future version could boot a throwaway
  vulnerable container per attempt and time the solve, which is why the brainstorm
  under `brainstorm/` leans that way. This v1 is the platform and auth layer.
