---
board: active
---

# Root Cause web platform

Turn the existing CTF challenge set into a hosted platform: Next.js frontend on
Vercel, Fastify + Postgres API on Railway, GitHub OAuth login, flag submission,
and a points leaderboard. Scope is the core platform.

Live: https://root-cause.matejbasic.com (web), https://root-cause-api.matejbasic.com (API).

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

# Self-host CTF platform (final plan)

Date: 2026-10-11
Source: grill-me session 2026-10-11 (final).
Supersedes the hosted-platform design, which is archived as a rejected
direction in brainstorm/unified-architecture.md.

Root Cause is a specialized CTF website: a catalog, accounts, a leaderboard, and
per-run dynamic flags. Users run each challenge on their own machine from a
docker-compose; a one-shot sidecar container fetches a unique flag from the API
and injects it, the user exploits the challenge to recover it, and submits it on
the web. The platform's only cost is the web app and API it already runs; all
challenge compute is on the user's machine. Open source, built as a portfolio
piece and a near-zero-marginal-cost product. No Linux or Windows tracks, no
hosting of labs.

## Decisions

- Self-host model: each challenge is a docker-compose the user runs locally. A
  one-shot flag-generator sidecar calls the API for a per-run flag and writes it
  into a shared volume at the challenge's flag path. The challenge app and the
  exploit are unchanged; the only image change is removing the baked-in flag.
- Honor-system tradeoff (accepted): the user owns the machine and can read the
  injected flag without solving. Dynamic flags stop lookup and sharing and give
  per-user attribution, but are not true anti-cheat, and the leaderboard is not
  competition-grade. True anti-cheat would need hosting, which is out of scope.
- Auth: a per-user API key (show-once, stored hashed, regenerate to rotate) in
  the user's local .env, scoped to flag issuance only. Submission is web-only
  (web JWT). A leaked key can only mint flags, nothing else.
- Run model: rename Instance -> Run { id, userId, challengeId, flagHash,
  createdAt, solvedAt? }; reuse generateDynamicFlag / checkFlagAgainst /
  userFlagHashesFor. Issue at POST /challenges/:slug/run (API-key auth); submit
  validates against the user's run-flag hashes. No validity expiry; prune old
  unsolved runs on a slow schedule.
- Sidecar: a small Go one-shot init container (source in the repo, image on
  Docker Hub), env-configured (API URL, API key, challenge slug, flag path), caches
  the flag in the shared volume, fails loudly on a bad key or no connectivity.
  The challenge depends_on it completing.
- Distribution: a committed compose file per challenge in the repo; the lab page
  shows the compose with copy and download and the `rootcause start <slug>` CLI
  command with copy and a CLI reminder; a Go CLI (login/list/start/stop/status,
  no submit) wraps the same compose, auto-injecting the stored key. GitHub
  Releases plus an install script.
- Catalog: launch with the four app-level challenges (zgrep, Spring4Shell,
  SHA-3, Text4Shell). ERMS dropped (external image, no dynamic flag). Dirty Pipe
  pending a test. (Superseded 2026-10-12: catalog grew to 30 active labs.)
- Cleanup: delete deployments/ (k8s manifests, ctf.tar.gz, Froxlor/ERMS scripts,
  old all-in-one compose) and update the README to the per-challenge compose
  model.
- Ship new CVE challenges regularly; each doubles as a public writeup (content
  and acquisition in one).

## Still open

- Dirty Pipe: does it trigger on a current/patched kernel inside a container? A
  real test must pass on a current kernel (Docker Desktop's VM kernel is modern
  and patched, so expect failure there). If it only works on an old kernel, it
  is a future VM box, not part of the compose catalog.
- Monetization: deferred. Marginal cost is near zero, so a paid tier (early
  access, more concurrent runs, etc.) stays possible later; not pursued now.
  Notes in brainstorm/monetization-budget.md and brainstorm/go-to-market.md.
- License choice for open-sourcing (MIT suggested).

## Tasks

### Backend core
- [x] Rename Instance -> Run and strip the hosting fields; keep the dynamic-flag libs (2026-10-12)
- [x] Add POST /challenges/:slug/run (API-key auth) that mints and stores a per-run flag (2026-10-12)
- [x] Add API-key generation in the profile (show-once, hashed) and key validation (2026-10-12)
- [x] Add per-key rate limiting on issuance with a daily cap (2026-10-12)
- [x] Update API_CONTRACT.md for the run issuance and API-key model (2026-10-12)

### Sidecar
- [x] Write the Go one-shot flag-generator (env config, volume cache, fail-loud) (2026-10-12)
- [x] Publish the sidecar image to Docker Hub, source in the repo (2026-10-12)

### Pilot (Text4Shell) end to end
- [x] Remove the baked flag from Text4Shell and add its compose file (sidecar + shared volume) (2026-10-12)
- [x] Publish the Text4Shell image and flip its seed to dynamic (2026-10-12)
- [x] Verify a full self-host solve: compose up, flag issued, exploit, web submit, solve recorded (2026-10-12)

### Web
- [x] Lab page run block: compose shown with copy and download, `rootcause start` command with copy, CLI reminder (2026-10-12)
- [x] Profile API-key UI (generate show-once, regenerate) (2026-10-12)

### Fan out challenges
- [x] Migrate zgrep to dynamic self-host (compose, sidecar, seed, verify) (2026-10-12)
- [x] Migrate Spring4Shell to dynamic self-host (2026-10-12)
- [x] Migrate SHA-3 to dynamic self-host (app reads the mounted flag file) (2026-10-12)

### CLI
- [x] Build the Go `rootcause` CLI (login/list/start/stop/status), source in the repo (2026-10-12)
- [x] Release via GitHub Releases plus an install script (2026-10-12)

### Publish and polish (open-source showcase)
- [x] Scan the repo and git history for secrets (2026-10-11)
- [x] Rewrite the root README for recruiters (2026-10-11)
- [x] Delete deployments/ and update the README to the per-challenge compose model (2026-10-12)
- [x] Correct CLAUDE.md and docs for accuracy (solo project) (2026-10-12)
- [x] Add a LICENSE (MIT) so the repo is genuinely open source (2026-10-12)
- [x] Recruiter-framing pass over platform/README.md (2026-10-12)
- [x] Purge 4 old exploit scripts from git history and make the repo public (2026-10-12)
- [~] Pin the repo on the GitHub profile (manual, UI-only; no API) (2026-10-12)

### Test
- [ ] Test Dirty Pipe on a current kernel in a container; decide drop vs future VM box

# Lab catalog expansion (2026-10-12)

Grew the active catalog from 7 to 30 labs via subagents, each independently
re-verified (fresh image, stub flag, real exploit). Added a web favicon and made
the homepage challenge/category/points counts read from the live catalog. Seeded
the leaderboard with six solves for matej-basic so it is not empty before
sharing. Made the repo public after purging four old exploit scripts from git
history (backup at ../root-cause-backup-20261012-135657.bundle). See
PICKUP_NOTES.md for the full lab list, the cyber-safeguard blocker, and the
incomplete/blocked labs.

## Tasks

- [x] Build and ship 23 new labs to reach 30 active (2026-10-12)
- [x] Add a web favicon and make the homepage catalog stats dynamic (2026-10-12)
- [x] Seed the leaderboard with six solves for the owner account (2026-10-12)
- [x] Purge exploit scripts from history and make the repo public (2026-10-12)
- [ ] Apply to the Cyber Verification Program, then build the safeguard-blocked RCE labs (2026-10-12)
- [ ] Fix and ship the three built-but-unconfirmed exploits: httpd, Django, Next.js (2026-10-12)
- [ ] Pin the repo on the GitHub profile (manual UI step) (2026-10-12)

# Lab catalog expansion wave 2 (2026-10-12)

Sixteen new labs from the compiled candidate list in
brainstorm/lab-candidates-2026-10.md (two verified research sweeps: 2024-2026
CVEs and custom single-bug-class ideas). Fills the catalog gaps: no SSTI, no
command injection, no deserialization, thin crypto and hard tiers.

Each lab follows the established pipeline: lab dir under labs/ with Dockerfile,
compose.yml and README, solve script in solutions/, independent re-verification
with a fresh image and a stub flag, image published as matejbasic/<slug>:1.0,
idempotent seed upsert. Build the RCE-flavored custom labs (ssti-preview,
cmdi-diagnostics, pickle-preferences, upload-rce) in the main session, not via
subagents (cyber safeguard). CVE-2024-9264 would be the second Grafana lab;
the bug is unrelated to grafana-traversal, kept unless decided otherwise.

## Tasks

### Tier A
- [x] Build lab CVE-2025-55182 react2shell: RSC deserialization pre-auth RCE, easy web (2026-10-12)
- [x] Build lab ssti-preview: Jinja2 SSTI to RCE, medium web, main session (2026-10-12)
- [x] Build lab cmdi-diagnostics: OS command injection in ping/dig page, easy web, main session (2026-10-12)
- [x] Build lab CVE-2026-60004 gitea-diffpatch-hook: git hook RCE via diffpatch API, medium web (2026-10-12)
- [x] Build lab pickle-preferences: pickle deserialization in a cookie, medium web, main session (2026-10-12)
- [x] Build lab padding-oracle: AES-CBC padding oracle token decryption, hard crypto (2026-10-12)
- [x] Build lab hash-length-extension: secret-prefix MAC forgery, medium crypto (2026-10-12)
- [x] Build lab CVE-2024-9264 grafana-duckdb-lfi: SQL Expressions file read, easy web (2026-10-12)

### Tier B
- [x] Build lab CVE-2024-36401 geoserver-xpath-rce: OGC XPath eval injection, medium web (2026-10-12)
- [x] Build lab CVE-2024-27198 teamcity-auth-bypass: path-confusion auth bypass to admin, medium web (2026-10-12)
- [x] Build lab upload-rce: unrestricted file upload to RCE, medium web, main session (2026-10-12)
- [x] Build lab weak-mfa-otp: brute-forceable 4-digit OTP, easy web (2026-10-12)
- [x] Build lab CVE-2024-7954 spip-eval-rce: porte_plume eval injection, medium web (2026-10-12)
- [x] Build lab CVE-2024-53677 struts-upload-ognl: file-upload OGNL traversal webshell, hard web (2026-10-12)
- [x] Build lab CVE-2025-24813 tomcat-partial-put: session deserialization via partial PUT, hard web (2026-10-12)
- [x] Build lab second-order-sqli: stored-payload SQLi in UPDATE, medium web (2026-10-12)
