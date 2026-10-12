# linkpreview-ssrf

## Vulnerability description

This lab is a hand-built challenge, not a CVE: a small link preview tool,
the kind a chat app or a note-taking tool uses to show a title and a snippet
when you paste in a URL. The server fetches whatever URL the caller submits
and shows back what it found. It has no allowlist of schemes or hosts, no
check for loopback or private address ranges, and it follows redirects.

That combination is a server-side request forgery (SSRF): the app will
happily make a request on the attacker's behalf to any address the server
itself can reach, not just the public internet the form seems to invite. A
request aimed at an address that only makes sense from inside the host, or
a redirect chain that ends there, gets fetched and its response handed back
in the preview, even though the caller could never have reached that address
directly.

## Vulnerable configuration

The preview endpoint takes a `url` form field and fetches it with the
`requests` library, with redirects on and no validation beyond "is this a
non-empty string":

```python
resp = requests.get(url, timeout=5, allow_redirects=True)
```

The same container also runs a second, internal-only HTTP service bound to
the loopback interface. It is never published in the Dockerfile or the
compose file, so nothing outside the container can reach it on its own,
only a request made from inside the container, such as the one the preview
tool issues, can get to it. Finding that service's address and path, and
getting the preview tool to fetch it on your behalf, is the exercise.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume; the `challenge` container reads that flag into its internal
service, then starts the public-facing preview app on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f linkpreview-ssrf/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

From there, the link preview form is your entry point. Paste a URL, and the
server fetches it for you, wherever that URL actually points.

Tear the lab down with:

```bash
docker compose -f linkpreview-ssrf/compose.yml down -v
```
