---
board: done
---

# Root Cause web platform

Turn the existing CTF challenge set into a hosted platform: Next.js frontend on
Vercel, Fastify + Postgres API on Railway, GitHub OAuth login, flag submission,
and a points leaderboard. Scope is the core platform. Ephemeral per-user
challenge containers (the AWS/Fargate provisioner from the brainstorm) are left
as documented future work.

Live: https://root-cause-ctf.vercel.app (web), https://root-cause-production-3c05.up.railway.app (API).

## Tasks

- [x] Define API contract and monorepo skeleton under platform/ (2026-10-10)
- [x] Backend API (platform/api): Fastify + Prisma + Postgres, GitHub OAuth, challenges, submit, leaderboard, seed (2026-10-10)
- [x] Frontend (platform/web): Next.js landing page, challenges, detail/submit, leaderboard, profile, auth (2026-10-10)
- [x] Local verification: builds, unit tests (flag hash, ranking), cold-API render (DB-backed paths verified later against the live stack) (2026-10-10)
- [x] Provision Railway: Postgres + API service, env vars, deploy (2026-10-10)
- [x] Create GitHub OAuth app, wire client id/secret and callback URLs (2026-10-10)
- [x] Deploy frontend to Vercel, wire API URL and allowed origin (2026-10-10)
- [x] Production smoke test: login, submit a flag, leaderboard updates (2026-10-10)
- [x] Docs: platform README and root README updated for the live platform (2026-10-10)
- [x] Commit and push to origin (2026-10-10)
