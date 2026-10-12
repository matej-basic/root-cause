# predictable-session-token

## Vulnerability description

`predictable-session-token` is a hand-built lab, not a CVE. It reproduces a
bug that shows up whenever a team writes its own session layer instead of
using a vetted library: the session token is not drawn from a secure random
source, it is calculated from a value anyone can observe or guess.

The scenario is a small internal service that issues its own session
tokens on login, rather than handing that job to a framework. A user logs
in at `POST /login` and gets a token back; every later request presents
that token as `Authorization: Bearer <token>` instead of a cookie. So far
this looks like an ordinary token-based session.

The bug is in how the token is generated. It is produced by seeding
Python's `random` module, a Mersenne Twister, with a value computed from
the username and the exact second the session was issued, then reading
hex characters off that seeded generator. A Mersenne Twister is fully
determined by its seed: feed it the same seed twice and it produces the
same output twice. Nothing about the token is unpredictable except that
one integer.

## Vulnerable configuration

The token recipe, exactly as implemented in `app.py`, is:

```
seed  = issued_at * 1_000_003 + crc32(username)
token = "".join(random.Random(seed).choice("0123456789abcdef") for _ in range(32))
```

where `issued_at` is the whole second (UTC, `int(time.time())`) at which
the session was created. `crc32` is Python's standard `zlib.crc32` over
the UTF-8 username.

This recipe is the published spec for the lab, the equivalent of a
vendor's documented token format. Knowing it is not the exercise. The
exercise is using it on a session you were never handed.

`GET /time` returns the server's current clock and its own process
uptime, `{"now": ..., "uptime": ...}`, so a client can work out not only
the current second but also the second the service itself booted:
`boot_second = now - uptime`.

Two accounts matter here (see `app.py`):

- `jdoe`, password `Harvest2024!`, role `user`. Its credentials are
  handed out so the recipe can be observed and verified honestly: log in,
  note the second you did it, and check that the token you got back is
  exactly what the recipe above predicts.
- `admin`, a random password generated at container start, role `admin`.
  Nobody is given this password, and nobody ever needs it. The admin
  account's session is not created by a login at all; it exists from the
  moment the container finished booting, the way a long-lived service or
  cron session might already be sitting there before any human arrives.
  Its token was computed with the same recipe, at the boot second.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. `GET /admin` reads it, but only for a request bearing
a session token that maps to the `admin` role.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f predictable-session-token/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl http://localhost:8080/time
```

From there, the recipe above is the only input you need. `/time` gives
you the service's current second and its uptime, which together give you
the second it booted, and the boot second is when admin's session was
created. Reconstructing admin's token from that one integer and the
published recipe, and presenting it back as a bearer token, gets you to
`GET /admin`, which is where the flag lives. A plain `jdoe` session
reaches the same endpoint and is turned away.

Tear the lab down with:

```bash
docker compose -f predictable-session-token/compose.yml down -v
```
