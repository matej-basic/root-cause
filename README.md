# Project for Penetration testing course

An educational Capture-the-Flag set for a university penetration-testing course.
Each challenge is a deliberately vulnerable app built around a historical CVE,
packaged so students can exploit it in a sandboxed lab.

## Live platform

The challenges are wrapped in a hosted platform: a challenge catalog, GitHub
sign-in, flag submission, and a points leaderboard.

- Play: https://root-cause-ctf.vercel.app
- API: https://root-cause-production-3c05.up.railway.app
- Code and setup: [`platform/`](platform/README.md)

It is a Next.js app on Vercel talking to a Fastify + Postgres API on Railway.
Flags are stored as SHA-256 hashes; the vulnerable apps below are what you
exploit to recover them.

## Challenges (built and deployed)

Six challenges exist as runnable images and Kubernetes manifests. The
`challenge_N` numbering in `deployments/` does not match the CVE numbers, so
both are given here.

| Deploy | CVE | Vulnerability | Source |
|---|---|---|---|
| challenge_1 | [CVE-2021-44966](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44966) | SQL injection auth bypass in PHPGURUKUL Employee Record Management System (erms) | README only; image `jura43/erms` built outside this repo |
| challenge_2 | [CVE-2022-0847](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-0847) | Dirty Pipe, Linux kernel local privilege escalation | `CVE-2022-0847/` |
| challenge_3 | [CVE-2022-1271](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-1271) | Arbitrary file write and RCE through `zgrep` | `CVE-2022-1271/` |
| challenge_4 | [CVE-2022-22965](https://nvd.nist.gov/vuln/detail/cve-2022-22965) | Spring4Shell RCE (Spring MVC on Tomcat WAR) | `CVE-2022-22965/` |
| challenge_5 | [CVE-2022-37454](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-37454) | SHA-3 (Keccak) buffer overflow | `CVE-2022-37454/` |
| challenge_6 | [CVE-2022-42889](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-42889) | Text4Shell RCE in Apache Commons Text | `CVE-2022-42889/` |

Reference links used while building these:

- CVE-2022-1271: https://www.youtube.com/watch?v=I4_ide0tEG8
- CVE-2022-42889: https://github.com/korteke/CVE-2022-42889-POC and https://hub.docker.com/r/korteke/text4shell
- CVE-2022-37454: https://github.com/python/cpython/issues/98517
- CVE-2022-0847: https://www.youtube.com/watch?v=af0PGYaqIWA

## Planned, not built

These CVEs were scoped for the course but have no challenge directory or
deployment yet.

- [CVE-2022-32275](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-32275)
- [CVE-2022-35861](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-35861)
- [CVE-2022-41323](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-41323)
- [CVE-2021-44026](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44026) (Roundcube; distinct from the built CVE-2021-44966 erms challenge, https://hub.docker.com/r/roundcube/roundcubemail/tags)
- [CVE-2021-39180](https://nvd.nist.gov/vuln/detail/CVE-2021-39180)
- [CVE-2022-21907](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-21907)

`deployments/scripts/` also carries Froxlor setup (`froxlor.sh`, `froxlor.yml`,
`froxlor.sql`) that is not wired into any `challenge_N` deployment.
