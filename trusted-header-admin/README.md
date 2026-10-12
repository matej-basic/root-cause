# trusted-header-admin

## Vulnerability description

This lab is a broken access control bug, built by hand rather than taken
from a CVE. It is a common pattern behind a load balancer or reverse proxy:
an internal admin panel is considered safe because "only the internal
network can reach it", and the application enforces that boundary by
reading a request header instead of checking where the TCP connection
actually came from.

Headers of that kind exist to let a trusted proxy tell the backend
something about the original client, for example its real IP address when
the proxy itself is the one connecting. The backend has no way to tell the
difference between a header set by its own proxy and the same header set
by whoever is sending the request, unless something upstream strips or
overwrites it first. Here nothing does. The application trusts the header
as sent, so a client that knows (or guesses, since this is a textbook
setup) which header the check relies on can simply set it itself and walk
straight through the gate meant to keep it out.

## Vulnerable configuration

The app is a small Go HTTP service with two routes: `/` and `/admin`.
`/admin` is documented, in this very file, as reachable from the internal
network only. The middleware in front of it does not look at the
connection's source address. It looks at a single client-supplied request
header and compares it against the value a loopback connection would
carry.

Get past that comparison with the right header value and `/admin` renders
an operations console that includes the flag. The flag itself is loaded
once at startup from `/flag/flag.txt`, written there by the Root Cause
flagger before the app starts, and is never exposed by any other route.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then starts the
Go service on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f trusted-header-admin/compose.yml up
```

Once it is up, the service answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl -i http://localhost:8080/admin
```

The plain request above gets a 403. The entry point is the same `/admin`
route, reached with a request header set to the value an internal,
loopback-originated request would carry. Find the header, set it, and the
console in the response carries the flag.

Tear the lab down with:

```bash
docker compose -f trusted-header-admin/compose.yml down -v
```
