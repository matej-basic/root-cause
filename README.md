# Root Cause

A hosted Capture-the-Flag platform plus a set of deliberately vulnerable apps,
each built around a real historical CVE from 2021-2022. You run a challenge on
your own machine, exploit the target, recover a flag, and submit it to the
platform, which handles sign-in, scoring, and a leaderboard. Built as the lab
environment for a university penetration-testing course.

- Play: https://root-cause.matejbasic.com
- API: https://root-cause-api.matejbasic.com

## What's in here

- **A web platform** (`platform/`): challenge catalog, GitHub sign-in, flag
  submission, and a points leaderboard.
- **Self-contained challenges** (`CVE-*/`): each a vulnerable app with a
  Dockerfile, a write-up of the bug, and an exploit or solve script.
- **A flagger sidecar and a CLI** (`sidecar/`, `cli/`): the pieces that fetch a
  per-run flag for a locally running challenge and wire it into the container.

## Architecture

The platform is a two-service app, deployed and live:

- **Web**: Next.js (App Router) + Tailwind on Vercel.
- **API**: Fastify + Prisma + PostgreSQL on Railway.
- **Auth**: GitHub OAuth, owned by the backend. The API completes the OAuth
  exchange and issues a short-lived JWT, handed to the web app in the URL
  fragment so it is never sent to a server or logged. No third-party cookies.
- **Flags** are stored only as SHA-256 hashes; submissions are rate-limited per
  user. Raw flag text is never stored.
- **Contract-first**: [`platform/API_CONTRACT.md`](platform/API_CONTRACT.md) is
  the single spec both services conform to; either side changes the contract
  before the code. Overview and local setup in
  [`platform/README.md`](platform/README.md).

## The challenges

The launch set is four app-level challenges, each wrapping a real CVE in a
minimal, runnable target. Every one of these mints a fresh flag per run (see
"Running a challenge locally" below), so the flag you submit is tied to your
account.

| Slug | CVE | Vulnerability | Source |
|---|---|---|---|
| zgrep-rce | [CVE-2022-1271](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-1271) | Arbitrary file write and RCE through `zgrep` | `CVE-2022-1271/` |
| spring4shell | [CVE-2022-22965](https://nvd.nist.gov/vuln/detail/cve-2022-22965) | Spring4Shell RCE (Spring MVC on a Tomcat WAR) | `CVE-2022-22965/` |
| sha3-overflow | [CVE-2022-37454](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-37454) | SHA-3 (Keccak) buffer overflow | `CVE-2022-37454/` |
| text4shell | [CVE-2022-42889](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-42889) | Text4Shell RCE in Apache Commons Text | `CVE-2022-42889/` |

Two more challenges live in the repo but are not in the live catalog yet.
Dirty Pipe ([CVE-2022-0847](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-0847),
a Linux kernel local privilege escalation in `CVE-2022-0847/`) is pending a
kernel test. The ERMS SQL injection challenge
([CVE-2021-44966](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44966),
in `CVE-2021-44966/`) is kept for reference but dropped from the launch set.

Each `CVE-*/README.md` explains the bug and walks through the intended solution.

## Running a challenge locally

You run each challenge on your own machine with Docker Compose. A one-shot
`flagger` sidecar calls the Root Cause API for a flag unique to this run and
writes it into a volume the challenge shares; the challenge then starts with
that flag in place. Nothing is baked into the image.

What you need:

1. An account on https://root-cause.matejbasic.com (sign in with GitHub).
2. An API key, generated on your profile page and shown once. Keep it; a
   regenerate replaces it.
3. The `rootcause` CLI (`cli/`), which generates the compose file for a
   challenge and runs it with your key.

```bash
rootcause login <the key from your profile>   # stored in ~/.config/rootcause
rootcause list                                 # see the catalog
rootcause start zgrep-rce                         # per-run flag, challenge up
```

The CLI stores the key in `~/.config/rootcause/config.json`. If you prefer not
to use it, the sidecar reads the key from `ROOTCAUSE_API_KEY` in the compose
file directly.

The challenge serves on port 8080. Exploit it, read the flag, and submit it on
the challenge page. The platform checks your submission against the flags issued
to your account, so a flag from someone else's run will not score.

## Scope and honesty

This is a teaching resource for a penetration-testing course, not a live
competition. Each live challenge issues a per-run flag tied to your account, so
a solve means you actually ran and exploited the target. The four launch
challenges are built and in the catalog; a handful of further CVEs were scoped
for the course but not built:

- [CVE-2022-32275](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-32275),
  [CVE-2022-35861](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-35861),
  [CVE-2022-41323](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-41323),
  [CVE-2021-44026](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44026),
  [CVE-2021-39180](https://nvd.nist.gov/vuln/detail/CVE-2021-39180),
  [CVE-2022-21907](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-21907).
