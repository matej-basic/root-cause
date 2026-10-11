# rootcause CLI

Command-line client for the [Root Cause](https://github.com/matej-basic/root-cause) CTF platform. It runs a challenge on your own machine with Docker, using the exact same per-challenge `docker-compose` the website hands out. A one-shot sidecar calls the API for a per-run flag and drops it into the challenge container, so the flag you capture is bound to your account.

Submitting flags stays on the website. There is no `submit` command here.

## Install

With a Go toolchain:

```bash
go install github.com/matej-basic/root-cause/cli@latest
```

The binary installs as `cli`. Rename or symlink it to `rootcause` if you want the shorter name on your PATH.

Prebuilt binaries will be attached to GitHub Releases, and a `curl | sh` installer is planned. Until then, `go install` or a local build is the way in:

```bash
cd cli
go build -o rootcause .
```

No third-party dependencies. The CLI is pure Go standard library and shells out to `docker` for the compose work, so you need Docker installed and running to use `start`, `stop`, and `status`.

## Usage

```
rootcause login [--key <key>] [--api-url <url>]
rootcause list
rootcause start <slug>
rootcause stop <slug>
rootcause status
```

### login

Stores your API key. Get the key from your profile on the website (it is shown once, right after you generate it).

```bash
rootcause login --key rc_live_xxxxxxxx
```

Without `--key` the CLI prompts for the key on stdin. The key and the API URL are written to `~/.config/rootcause/config.json` with the file mode set to `0600`. Pass `--api-url` to point at a different backend; it defaults to the stored value, or `https://root-cause-api.matejbasic.com` on a fresh config.

### list

Fetches the challenge catalog and prints slug, title, and difficulty.

```bash
rootcause list
```

### start

Reads the challenge's published image from the API, writes the generated compose and a sibling `.env` under `~/.cache/rootcause/<slug>/`, then runs `docker compose up` in the foreground and streams the output. Leave it running in the terminal; the challenge is up once the sidecar has finished and the app container reports ready. The app is published on `localhost:8080`.

```bash
rootcause start zgrep-rce
```

The API key is never written into `compose.yml`. It goes only into the `.env` next to it, which the CLI writes at `0600`, and the compose reads it as `${ROOTCAUSE_API_KEY}`.

### stop

Tears the challenge down.

```bash
rootcause stop zgrep-rce
```

### status

Lists the rootcause challenges currently running. Best effort: it uses `docker compose ls` where available and falls back to inspecting running containers.

```bash
rootcause status
```

## Files it touches

- `~/.config/rootcause/config.json` holds the API URL and key, mode `0600`.
- `~/.cache/rootcause/<slug>/compose.yml` is the generated compose for one challenge.
- `~/.cache/rootcause/<slug>/.env` holds `ROOTCAUSE_API_KEY`, mode `0600`.

Both roots honor `XDG_CONFIG_HOME` and `XDG_CACHE_HOME` when those are set.
