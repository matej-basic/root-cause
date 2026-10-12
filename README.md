# Root Cause

A hosted Capture-the-Flag platform with 30 deliberately vulnerable labs: some
wrap a real historical CVE, others are hand-built apps that isolate a single bug
class. You run a lab on your own machine, exploit the target, recover a flag, and
submit it to the platform, which handles sign-in, scoring, and a leaderboard.
Built as the lab environment for a university penetration-testing course.

- Play: https://root-cause.matejbasic.com
- API: https://root-cause-api.matejbasic.com

## What's in here

- **A web platform** (`platform/`): challenge catalog, GitHub sign-in, flag
  submission, and a points leaderboard.
- **Self-contained challenges** (`labs/`): each a vulnerable app with a
  Dockerfile, a `compose.yml`, and a write-up of the bug.
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

The catalog is 30 runnable labs worth 7,650 points. Twelve wrap a real historical
CVE (2021 to 2025); eighteen are hand-built apps that isolate a single bug class
from first principles. Every lab mints a fresh flag per run (see "Running a
challenge locally" below), so the flag you submit is tied to your account.
Difficulty runs easy (9), medium (15) and hard (6); most are web, with two crypto
and one misc. Each lab lives in `labs/<name>/`, with its write-up in that dir's
`README.md`.

### Historical CVE labs

| Slug | CVE | Vulnerability | Difficulty |
|---|---|---|---|
| grafana-traversal | [CVE-2021-43798](https://nvd.nist.gov/vuln/detail/CVE-2021-43798) | Grafana plugin path traversal | easy |
| vite-fs-traversal | [CVE-2025-30208](https://nvd.nist.gov/vuln/detail/CVE-2025-30208) | Vite dev-server arbitrary file read | easy |
| aiohttp-traversal | [CVE-2024-23334](https://nvd.nist.gov/vuln/detail/CVE-2024-23334) | aiohttp static-route path traversal | easy |
| whistle-traversal | [CVE-2025-5880](https://nvd.nist.gov/vuln/detail/CVE-2025-5880) | Whistle unauthenticated file read | easy |
| zgrep-rce | [CVE-2022-1271](https://nvd.nist.gov/vuln/detail/CVE-2022-1271) | zgrep arbitrary file write to RCE | medium |
| sha3-overflow | [CVE-2022-37454](https://nvd.nist.gov/vuln/detail/CVE-2022-37454) | SHA-3 (Keccak) buffer overflow | medium |
| text4shell | [CVE-2022-42889](https://nvd.nist.gov/vuln/detail/CVE-2022-42889) | Apache Commons Text interpolation RCE | medium |
| spring-cloud-function-spel | [CVE-2022-22963](https://nvd.nist.gov/vuln/detail/CVE-2022-22963) | Spring Cloud Function SpEL injection RCE | medium |
| langflow-rce | [CVE-2025-3248](https://nvd.nist.gov/vuln/detail/CVE-2025-3248) | Langflow unauthenticated RCE | medium |
| xwiki-solr-rce | [CVE-2025-24893](https://nvd.nist.gov/vuln/detail/CVE-2025-24893) | XWiki SolrSearch template-injection RCE | medium |
| request-baskets-ssrf | [CVE-2023-27163](https://nvd.nist.gov/vuln/detail/CVE-2023-27163) | request-baskets forward_url SSRF | medium |
| spring4shell | [CVE-2022-22965](https://nvd.nist.gov/vuln/detail/CVE-2022-22965) | Spring MVC data-binding RCE on Tomcat | hard |

### Custom bug-class labs

| Slug | Bug class | Difficulty |
|---|---|---|
| invoice-idor | IDOR / missing object-level authorization | easy |
| report-download-traversal | app-logic path traversal | easy |
| login-sqli | SQL injection auth bypass and UNION exfiltration | easy |
| role-mass-assignment | mass-assignment privilege escalation | easy |
| trusted-header-admin | broken access control via a trusted header | easy |
| jwt-alg-none | JWT alg:none acceptance | medium |
| jwt-weak-secret | crackable HS256 signing secret | medium |
| nosql-login-bypass | NoSQL operator injection | medium |
| graphql-idor | GraphQL introspection plus IDOR | medium |
| xxe-invoice-import | XML external entity file read | medium |
| linkpreview-ssrf | SSRF to a loopback-only service | medium |
| negative-quantity-checkout | business-logic flaw (negative quantity) | medium |
| predictable-reset-token | predictable password-reset token | medium |
| blind-sqli-tracker | boolean blind SQL injection | hard |
| predictable-session-token | weak-PRNG session token | hard |
| giftcard-race | race condition / TOCTOU double-redeem | hard |
| config-merge-proto | prototype pollution privilege escalation | hard |
| ecb-cookie-cutpaste | AES-ECB cut-and-paste | hard |

A few labs live in the repo but are held out of the live catalog: Dirty Pipe
([CVE-2022-0847](https://nvd.nist.gov/vuln/detail/CVE-2022-0847), a kernel privilege
escalation) pending a kernel test, Laravel Ignition RCE
([CVE-2021-3129](https://nvd.nist.gov/vuln/detail/CVE-2021-3129)) pending an
exploit-reliability fix, and an ERMS SQL injection challenge
([CVE-2021-44966](https://nvd.nist.gov/vuln/detail/CVE-2021-44966)) kept for
reference. Each lab's `README.md` explains the bug and the intended approach.

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
competition. Each lab issues a per-run flag tied to your account, so a solve
means you actually ran and exploited the target. All 30 labs above are built and
in the live catalog. The set grows over time, and a batch of harder
remote-code-execution labs is staged for a later release.
