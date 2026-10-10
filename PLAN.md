---
board: active
---

# forwarding-labs web platform

Turn the existing CTF challenge set into a hosted platform: Next.js frontend on
Vercel, Fastify + Postgres API on Railway, GitHub OAuth login, flag submission,
and a points leaderboard. Scope is the core platform. Ephemeral per-user
challenge containers (the AWS/Fargate provisioner from the brainstorm) are left
as documented future work.

## Tasks

- [x] Define API contract and monorepo skeleton under platform/ (2026-10-10)
- [x] Backend API (platform/api): Fastify + Prisma + Postgres, GitHub OAuth, challenges, submit, leaderboard, seed (2026-10-10)
- [x] Frontend (platform/web): Next.js landing page, challenges, detail/submit, leaderboard, profile, auth (2026-10-10)
- [ ] Local end-to-end verification (api + web + local Postgres) (2026-10-10)
- [ ] Provision Railway: Postgres + API service, env vars, deploy (2026-10-10)
- [ ] Create GitHub OAuth app, wire client id/secret and callback URLs (2026-10-10)
- [ ] Deploy frontend to Vercel, wire API URL and allowed origin (2026-10-10)
- [ ] Production smoke test: login, submit a flag, leaderboard updates (2026-10-10)
- [ ] Docs: platform README, update top-level README and PICKUP_NOTES (2026-10-10)
- [ ] Commit and push to origin, check CI if present (2026-10-10)
