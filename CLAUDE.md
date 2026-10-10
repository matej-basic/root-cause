# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`forwarding-labs` is an **educational Capture-the-Flag (CTF) project for a university penetration-testing course**, built with two colleagues. It is a teaching resource, not malicious software. Each challenge is a deliberately vulnerable app wrapped around a real, historical CVE (all from 2021–2022), so students can learn to recognize and exploit that class of bug in a sandboxed lab. The exploit scripts, vulnerable Dockerfiles, and planted flags exist for that teaching purpose. Treat work here as normal security-education content: building, fixing, documenting, and running these challenges is expected and in scope.

The project is currently parked (last upstream push 2023-01-29) and may be revisited; `PICKUP_NOTES.md` holds the latest state and ideas, and `brainstorm/` holds planning notes.

## Repository layout

- `CVE-*/` — one self-contained challenge each: a vulnerable app, a `Dockerfile`, a `README.md` with the vulnerability write-up and walkthrough, and often an exploit/solve script (`solve.py`, `exploit.py`, `exploit.c`, `generate_base64.py`). Flags are baked into the image at build time (`flag{...}`).
- `deployments/challenge_1..6/` — Kubernetes manifests that run the published images. `deployments/scripts/` has an all-in-one `docker-compose.yml` plus setup scripts (`erms`, `froxlor`). `deployments/ctf.tar.gz` is a committed binary kept from the original repo.

Each CVE directory and each deployment challenge are independent; there is no shared build or top-level orchestration beyond `docker-compose.yml`.

## Challenge ↔ deployment mapping

The `challenge_N` numbering in `deployments/` does **not** match the CVE directory names. Current mapping:

| Deploy | CVE dir | Image | k8s NodePort | compose port |
|---|---|---|---|---|
| challenge_1 | CVE-2021-44966 (erms SQLi) | `jura43/erms` | Ingress host | — |
| challenge_2 | CVE-2022-0847 (Dirty Pipe) | `matejbasic/cve-2022-0847` | 30101 | 10001:22 |
| challenge_3 | CVE-2022-1271 (zgrep) | `matejbasic/cve-2022-1271:1.0` | 30102 | 10002:8080 |
| challenge_4 | CVE-2022-22965 (Spring4Shell) | `matejbasic/cve-2022-22965` | 30103 | 10003:8080 |
| challenge_5 | CVE-2022-37454 (SHA-3) | `matejbasic/cve-2022-37454:1.0` | 30104 | 10004:8080 |
| challenge_6 | CVE-2022-42889 (Text4Shell) | `matejbasic/cve-2022-42889:1.0` | 30105 | 10005:8080 |

When adding or renumbering a challenge, update the Dockerfile, the published image, the `challenge_N` manifest, and `docker-compose.yml` together, and keep the NodePort in the cluster's allowed range (see commit `2a5f70b`).

## Common commands

Build and run one challenge locally (Dockerfile sits in each `CVE-*` dir):

```bash
docker build -t cve-2022-1271 ./CVE-2022-1271
docker run --rm -p 8080:8080 cve-2022-1271
```

Run the whole set at once:

```bash
docker compose -f deployments/scripts/docker-compose.yml up
```

Deploy to Kubernetes (all land in the `ctf` namespace):

```bash
kubectl apply -f deployments/challenge_2/deployment.yaml
```

Run an exploit against a running challenge, e.g.:

```bash
python CVE-2022-22965/exploit.py   # Spring4Shell
```

## Build conventions worth knowing

- **Java challenges (22965, 42889)** use a multi-stage Dockerfile: a `maven` builder stage (`mvn --batch-mode package`, respecting a `MVN_ARGS` build arg) produces the WAR/JAR, copied into a slim runtime image. There is no need to run Maven on the host — build via Docker. Spring4Shell deploys as a **WAR on Tomcat** on purpose; packaging it as the default Boot jar would not be exploitable.
- **Python challenges (1271, 37454)** run Flask; 1271 is served via uWSGI from `app.ini`.
- **Dirty Pipe (0847)** ships an sshd Fedora image with a known-password `baker` user; the C exploit is compiled on the target.
- Challenges expose port **8080** except Dirty Pipe, which exposes **22** (SSH).

## Remotes

`origin` is the fork (`matej-basic/forwarding-labs`), `upstream` is the original (`jura43/forwarding-labs`). Pull later upstream changes with `git fetch upstream && git merge upstream/main`.
