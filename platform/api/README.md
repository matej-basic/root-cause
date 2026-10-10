# Root Cause API

Backend for the Root Cause CTF platform. Fastify v5 on Node 24, Prisma on
Postgres, GitHub OAuth with a stateless bearer JWT. The authoritative spec is
`../API_CONTRACT.md`; this README covers how to run it.

## Endpoints

- `GET /health` — liveness, no auth, no DB.
- `GET /auth/github` — redirect to GitHub authorize.
- `GET /auth/github/callback` — OAuth callback, redirects to the frontend with the token in the URL fragment.
- `GET /me` — the signed-in user's profile, points, solve count, rank, and solved challenge ids (auth).
- `GET /challenges` — challenge list without flag hashes or descriptions (auth optional; `solved` reflects the caller).
- `GET /challenges/:slug` — one challenge including its markdown description (auth optional).
- `POST /challenges/:slug/submit` — submit a flag, body `{ "flag": "..." }` (auth, 10 submissions/min/user).
- `GET /leaderboard` — public scoreboard.

## Environment variables

Copy `.env.example` to `.env` and fill it in.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. |
| `JWT_SECRET` | Signs app JWTs and the OAuth CSRF state. Use a long random value. |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client id. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret. |
| `GITHUB_CALLBACK_URL` | `{API_ORIGIN}/auth/github/callback`, matching the GitHub app. |
| `WEB_ORIGIN` | Frontend origin, used for the login redirect and CORS. |
| `PORT` | Listen port. Defaults to 4000; Railway sets it automatically. |

The GitHub OAuth app's "Authorization callback URL" must equal `GITHUB_CALLBACK_URL`.

## Local development

```bash
npm install
cp .env.example .env     # then edit the values
npx prisma generate      # generate the Prisma client
npx prisma db push       # create the tables in your Postgres
npm run seed             # load the six challenges
npm run dev              # tsx watch, listens on :4000
```

`npm run dev` serves on `http://localhost:4000`. CORS allows `WEB_ORIGIN` and
`http://localhost:3000`.

## Seeding

`npm run seed` runs `prisma/seed.ts`, which upserts the six challenges by slug,
so it is safe to run more than once. Descriptions are drawn from each
`CVE-*/README.md`. Only flag hashes are stored; raw flags never live in this
repo. `erms-sqli` ships with no flag hash, so submissions for it return
`422 submissions_disabled`.

## Tests

```bash
npm test
```

Vitest covers the flag hash check, the leaderboard ranking comparator and its
tiebreaks, and a `/health` request through `app.inject()`. The tests do not
need Postgres and open no database connection.

## Build

```bash
npm run build     # tsc -> dist/
npm start         # prisma db push, then node dist/server.js
```

## Railway

- Set the service root directory to `platform/api`.
- Add a Postgres plugin and let it populate `DATABASE_URL`.
- Set `JWT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
  `GITHUB_CALLBACK_URL`, and `WEB_ORIGIN`. `PORT` is injected by Railway.
- The image builds from the `Dockerfile` (Node 24 slim with OpenSSL for Prisma).
  Its start command runs `prisma db push` and then the server.
- Run the seed once after the first deploy, e.g. `npm run seed` from a Railway
  shell or a one-off job, so the challenges exist.
