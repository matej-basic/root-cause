# rootcause CLI

Command-line client for the [Root Cause](https://github.com/matej-basic/root-cause) CTF platform. It runs a challenge on your own machine with Docker, using the exact same per-challenge `docker-compose` the website hands out. A one-shot sidecar calls the API for a per-run flag and drops it into the challenge container, so the flag you capture is bound to your account.

Submitting flags stays on the website. There is no `submit` command here.

## Install

Download the prebuilt binary for your platform from the [latest release](https://github.com/matej-basic/root-cause/releases/latest) and put it on your PATH.

macOS / Linux:

```bash
os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
curl -fsSL -o rootcause "https://github.com/matej-basic/root-cause/releases/latest/download/rootcause-${os}-${arch}"
chmod +x rootcause && sudo mv rootcause /usr/local/bin/
```

Windows: download `rootcause-windows-amd64.exe` from the [releases page](https://github.com/matej-basic/root-cause/releases/latest) and add it to your PATH.

Releases are cut by pushing a `cli-v*` tag, which runs `.github/workflows/cli-release.yml` to cross-compile and attach the binaries.

### From source

No third-party dependencies (pure Go standard library), so a local build is just:

```bash
cd cli
go build -o rootcause .
```

(`go install github.com/matej-basic/root-cause/cli@latest` also works, but names the binary `cli`.)

You need Docker installed and running to use `start`, `stop`, and `status`.

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
