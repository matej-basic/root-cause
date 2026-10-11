# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`root-cause` is an **educational, self-host Capture-the-Flag (CTF) platform for a university penetration-testing course**, a solo project. It is a teaching resource, not malicious software. Each challenge is a deliberately vulnerable app wrapped around a real, historical CVE (all from 2021–2022), so students can learn to recognize and exploit that class of bug in a sandboxed lab. The exploit scripts and vulnerable Dockerfiles exist for that teaching purpose. Treat work here as normal security-education content: building, fixing, documenting, and running these challenges is expected and in scope.

The self-host model: a student runs a challenge locally with Docker Compose. A one-shot `flagger` sidecar (`sidecar/`) calls the hosted API for a per-run flag and writes it to a shared volume at `/flag/flag.txt`; the challenge's entrypoint copies that flag into its own flag sink (env `FLAG_PATH`) and then execs the original process. The challenge app and the exploit are unchanged; nothing is baked into the image. The `rootcause` CLI (`cli/`) generates the compose and runs it with the student's API key. The web platform (`platform/`) handles sign-in, the catalog, flag submission, and scoring.

`PICKUP_NOTES.md` holds the latest state and open items; `brainstorm/` holds planning notes.

## Repository layout

- `CVE-*/`: one self-contained challenge each: a vulnerable app, a `Dockerfile`, a `README.md` with the vulnerability write-up and walkthrough, and often an exploit/solve script (`solve.py`, `exploit.py`, `exploit.c`, `generate_base64.py`). Flags are injected at run time by the sidecar, not baked into the image.
- `platform/`: the hosted web app. `platform/api` (Fastify + Prisma + Postgres) and `platform/web` (Next.js), with `platform/API_CONTRACT.md` as the shared spec.
- `sidecar/`: the one-shot flagger that mints a per-run flag and writes it to `/flag/flag.txt`.
- `cli/`: the `rootcause` CLI (Go) that logs in with an API key, lists challenges, and brings one up locally.

Each CVE directory is independent; there is no shared build.

## Launch catalog

The live catalog is four app-level challenges, all dynamic (a per-run flag per attempt). Published images:

| Slug | CVE dir | Vulnerability | Image |
|---|---|---|---|
| zgrep-rce | CVE-2022-1271 | zgrep arbitrary file write / RCE | `matejbasic/cve-2022-1271:1.0` |
| spring4shell | CVE-2022-22965 | Spring4Shell RCE (Tomcat WAR) | `matejbasic/cve-2022-22965` |
| sha3-overflow | CVE-2022-37454 | SHA-3 (Keccak) buffer overflow | `matejbasic/cve-2022-37454:1.0` |
| text4shell | CVE-2022-42889 | Text4Shell RCE in Commons Text | `matejbasic/cve-2022-42889:1.0` |

Two challenges stay in the repo but out of the live catalog: Dirty Pipe (CVE-2022-0847, in `CVE-2022-0847/`) is inactive pending a kernel test, and the ERMS SQL injection challenge (CVE-2021-44966) is dropped from the launch set.

## Common commands

Build and run one challenge image locally (Dockerfile sits in each `CVE-*` dir):

```bash
docker build -t cve-2022-1271 ./CVE-2022-1271
docker run --rm -p 8080:8080 cve-2022-1271
```

Run a challenge the way a student does, with a per-run flag from the API:

```bash
rootcause login <api-key-from-profile>
rootcause run zgrep-rce
```

Run an exploit against a running challenge, e.g.:

```bash
python CVE-2022-22965/exploit.py   # Spring4Shell
```

## Build conventions worth knowing

- **Java challenges (22965, 42889)** use a multi-stage Dockerfile: a `maven` builder stage (`mvn --batch-mode package`, respecting a `MVN_ARGS` build arg) produces the WAR/JAR, copied into a slim runtime image. There is no need to run Maven on the host: build via Docker. Spring4Shell deploys as a **WAR on Tomcat** on purpose; packaging it as the default Boot jar would not be exploitable.
- **Python challenges (1271, 37454)** run Flask; 1271 is served via uWSGI from `app.ini`.
- **Dirty Pipe (0847)** ships an sshd Fedora image with a known-password `baker` user; the C exploit is compiled on the target.
- Challenges expose port **8080** except Dirty Pipe, which exposes **22** (SSH).

## Deployment and domains

The CTF platform (`platform/`) runs on custom domains since the migration of 2026-10-11. DNS is in the Cloudflare zone `matejbasic.com`, DNS-only (grey cloud) records.

- Web: Vercel project `root-cause` at https://root-cause.matejbasic.com, with `NEXT_PUBLIC_API_URL=https://root-cause-api.matejbasic.com` (inlined at build time, so redeploy after changing it). The old https://root-cause-ctf.vercel.app now 301-redirects; that redirect lives on the Vercel project and must stay.
- API: Railway service `root-cause` at https://root-cause-api.matejbasic.com. The old `root-cause-production-3c05.up.railway.app` still serves directly, because Railway service domains cannot redirect. Env: `WEB_ORIGIN=https://root-cause.matejbasic.com`, `GITHUB_CALLBACK_URL=https://root-cause-api.matejbasic.com/auth/github/callback`.
- Login is a GitHub OAuth App (client id `Ov23li8BnAgcCHARc6G2`) with a single callback URL, editable only by hand at github.com. Any future API host change must update that callback first, then `GITHUB_CALLBACK_URL`.

## Remotes

`origin` is the fork (`matej-basic/forwarding-labs`), `upstream` is the original (`jura43/forwarding-labs`). Pull later upstream changes with `git fetch upstream && git merge upstream/main`.
