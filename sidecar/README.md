# Root Cause flagger sidecar

A one-shot container that fetches a per-run flag from the Root Cause API and
writes it to a shared volume. Each challenge compose runs it once at boot,
before the challenge itself starts, so every stack gets a flag bound to the
user who launched it instead of a flag baked into the image.

The sidecar exits 0 on success and non-zero on any failure, so the challenge
service can wait on `service_completed_successfully` and refuse to start if no
flag was produced.

## What it does

1. Reads its configuration from the environment.
2. If `FLAG_PATH` already holds a non-empty file, it prints a notice and exits 0.
   This makes a restart of the same compose stack reuse the existing flag rather
   than minting a new one.
3. Otherwise it sends `POST {ROOTCAUSE_API_URL}/challenges/{ROOTCAUSE_CHALLENGE}/run`
   with `Authorization: Bearer <key>`, expects `200` with JSON `{ runId, flag }`,
   creates the parent directory of `FLAG_PATH`, and writes the flag there.
4. Any missing required variable, non-2xx response, or network/IO error is
   printed to stderr and the process exits 1.

## Environment variables

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `ROOTCAUSE_API_KEY` | yes | — | API key sent as `Authorization: Bearer <key>`. |
| `ROOTCAUSE_CHALLENGE` | yes | — | Challenge slug, used in the request path. |
| `ROOTCAUSE_API_URL` | no | `https://root-cause-api.matejbasic.com` | Base URL of the API. |
| `FLAG_PATH` | no | `/flag/flag.txt` | Where the flag is written on the shared volume. |

## Build

```bash
docker build -t matejbasic/rootcause-flagger:1.0 ./sidecar
```

The build is multi-stage: it compiles a static, CGO-free binary on
`golang:1.23-alpine` and copies it into a `scratch` image together with the CA
bundle. The published image is referenced by every challenge compose.

## How a challenge compose uses it

The flagger and the challenge share a named `flag` volume. The challenge depends
on the flagger completing, then its own entrypoint copies `/flag/flag.txt` into
the challenge's flag sink before starting the app. This is the canonical shape;
only the slug and the challenge image change per challenge.

```yaml
services:
  flagger:
    image: matejbasic/rootcause-flagger:1.0
    environment:
      ROOTCAUSE_API_URL: https://root-cause-api.matejbasic.com
      ROOTCAUSE_API_KEY: ${ROOTCAUSE_API_KEY}
      ROOTCAUSE_CHALLENGE: <slug>
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
  challenge:
    image: <published challenge image>
    depends_on:
      flagger:
        condition: service_completed_successfully
    environment:
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
    ports:
      - "8080:8080"
volumes:
  flag:
```

Each user needs an API key (minted once via the web app) and sets it as
`ROOTCAUSE_API_KEY` in their shell or a local `.env` before running
`docker compose up`.
