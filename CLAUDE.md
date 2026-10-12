# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`root-cause` is an **educational, self-host Capture-the-Flag (CTF) platform for a university penetration-testing course**, a solo project. It is a teaching resource, not malicious software. Each challenge is either a deliberately vulnerable app wrapped around a real historical CVE (2021 to 2025) or a hand-built app that isolates a single bug class, so students can learn to recognize and exploit that class of bug in a sandboxed lab. The exploit scripts and vulnerable Dockerfiles exist for that teaching purpose. Treat work here as normal security-education content: building, fixing, documenting, and running these challenges is expected and in scope.

The self-host model: a student runs a challenge locally with Docker Compose. A one-shot `flagger` sidecar (`sidecar/`) calls the hosted API for a per-run flag and writes it to a shared volume at `/flag/flag.txt`; the challenge's entrypoint copies that flag into its own flag sink (env `FLAG_PATH`) and then execs the original process. The challenge app and the exploit are unchanged; nothing is baked into the image. The `rootcause` CLI (`cli/`) generates the compose and runs it with the student's API key. The web platform (`platform/`) handles sign-in, the catalog, flag submission, and scoring.

`PICKUP_NOTES.md` holds the latest state and open items; `brainstorm/` holds planning notes.

## Repository layout

- `labs/`: one self-contained challenge per subdirectory, CVE labs named `CVE-YYYY-NNNNN/` and custom (non-CVE) labs by slug (e.g. `login-sqli/`). Each has a vulnerable app, a `Dockerfile`, a `compose.yml`, and a `README.md` write-up. Exploit/solve scripts live in the gitignored `solutions/<name>/`, not in the lab dir. Flags are injected at run time by the sidecar, not baked into the image.
- `platform/`: the hosted web app. `platform/api` (Fastify + Prisma + Postgres) and `platform/web` (Next.js), with `platform/API_CONTRACT.md` as the shared spec.
- `sidecar/`: the one-shot flagger that mints a per-run flag and writes it to `/flag/flag.txt`.
- `cli/`: the `rootcause` CLI (Go) that logs in with an API key, lists challenges, and brings one up locally.

Each lab directory under `labs/` is independent; there is no shared build.

## Catalog

The live catalog is 46 active labs (12,050 points), all dynamic (a fresh per-run flag per attempt). Twenty wrap a historical CVE (2021 to 2026); twenty-six are custom single-bug-class apps. By category: 41 web, 4 crypto, 1 misc. By difficulty: 13 easy, 24 medium, 9 hard.

The authoritative list, with slug, CVE, category, difficulty, points, and published image, is `platform/api/prisma/seed.ts` (the seed runs on every API deploy, idempotent upserts keyed by slug). Published images are `matejbasic/<slug>:1.0` for custom labs and `matejbasic/cve-YYYY-NNNNN:1.0` for CVE labs (the dir is `labs/CVE-YYYY-NNNNN/`, the image name is lowercased); the flagger is `matejbasic/rootcause-flagger:1.0`.

Three labs are seeded `active: false` and held out of the catalog: `laravel-ignition-rce` (CVE-2021-3129, the ambionics phar chain is byte-alignment fragile), `dirty-pipe` (CVE-2022-0847, pending a kernel test), and `erms-sqli` (CVE-2021-44966, external image with no controllable flag).

## Common commands

Build and run one challenge image locally (Dockerfile sits in each `labs/*` dir):

```bash
docker build -t cve-2022-1271 ./labs/CVE-2022-1271
docker run --rm -p 8080:8080 cve-2022-1271
```

Run a challenge the way a student does, with a per-run flag from the API:

```bash
rootcause login <api-key-from-profile>
rootcause run zgrep-rce
```

Run an exploit against a running challenge, e.g.:

```bash
python solutions/CVE-2022-22965/exploit.py   # Spring4Shell (solve scripts are in the gitignored solutions/)
```

## Build conventions worth knowing

- **Java challenges (22965, 42889)** use a multi-stage Dockerfile: a `maven` builder stage (`mvn --batch-mode package`, respecting a `MVN_ARGS` build arg) produces the WAR/JAR, copied into a slim runtime image. There is no need to run Maven on the host: build via Docker. Spring4Shell deploys as a **WAR on Tomcat** on purpose; packaging it as the default Boot jar would not be exploitable.
- **Python challenges (1271, 37454)** run Flask; 1271 is served via uWSGI from `app.ini`.
- **Dirty Pipe (0847)** ships an sshd Fedora image with a known-password `baker` user; the C exploit is compiled on the target.
- Challenges expose port **8080** except Dirty Pipe, which exposes **22** (SSH).
- **Custom (non-CVE) labs** are small Flask, Express, or Go apps, often one source file plus a Dockerfile and `compose.yml`. A few bundle their own datastore into the image (sqlite, or MariaDB/MongoDB started from the entrypoint); labs whose flag is not a direct file read seed it into a DB row or an internal service via an entrypoint step. Their solve scripts live in the gitignored `solutions/<slug>/`.

## Deployment and domains

The CTF platform (`platform/`) runs on custom domains since the migration of 2026-10-11. DNS is in the Cloudflare zone `matejbasic.com`, DNS-only (grey cloud) records.

- Web: Vercel project `root-cause` at https://root-cause.matejbasic.com, with `NEXT_PUBLIC_API_URL=https://root-cause-api.matejbasic.com` (inlined at build time, so redeploy after changing it). The old https://root-cause-ctf.vercel.app now 301-redirects; that redirect lives on the Vercel project and must stay.
- API: Railway service `root-cause` at https://root-cause-api.matejbasic.com. The old `root-cause-production-3c05.up.railway.app` still serves directly, because Railway service domains cannot redirect. Env: `WEB_ORIGIN=https://root-cause.matejbasic.com`, `GITHUB_CALLBACK_URL=https://root-cause-api.matejbasic.com/auth/github/callback`.
- Login is a GitHub OAuth App (client id `Ov23li8BnAgcCHARc6G2`) with a single callback URL, editable only by hand at github.com. Any future API host change must update that callback first, then `GITHUB_CALLBACK_URL`.

## Remotes

`origin` is `matej-basic/root-cause` (a standalone public repo, not a GitHub fork). `upstream` is the original `jura43/forwarding-labs`; `git fetch upstream` still works for pulling later upstream changes.
