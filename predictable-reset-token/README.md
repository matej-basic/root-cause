# predictable-reset-token

## Vulnerability description

`predictable-reset-token` is a hand-built lab, not a CVE. It reproduces a
bug that shows up whenever a team rolls its own password-reset flow instead
of using a vetted library: the reset token is derived from predictable
inputs instead of drawn from a secure random source.

The scenario is a self-service password portal for a fictional staffing
company, Meridian. A user who forgets their password posts their username
to `/reset/request`; in a real deployment this would email a reset link
containing a token. The user then posts that token to `/reset/confirm`
along with a new password.

The bug is in how the token is computed. It is not a random value stored
server-side and checked by equality; it is calculated on demand from the
username and the current time, which means anyone who knows the formula
can calculate the same value for any account, without ever receiving the
reset email.

## Vulnerable configuration

The token recipe, exactly as implemented in `app.py`, is:

```
token = md5(f"{username}:{minute}")
```

where `minute` is the server's wall clock, UTC, floored to whole minutes
(`int(time.time() // 60)`). A token is accepted for the minute it was
computed for or the one immediately before it, so a request that lands
right on a minute boundary still works.

This recipe is the published spec for the lab, the equivalent of a vendor's
documented token format. Knowing it is not the exercise. The exercise is
using it: computing the token for an account you were never emailed a
reset link for, confirming the reset, and logging in.

`GET /time` returns the server's current minute value directly, so there
is no need to guess at clock skew between your machine and the container.

Two accounts are seeded (see `app.py`):

- `jsmith`, password `Meridian2024!`, role `user`. Its credentials are
  handed out so the reset flow itself can be exercised honestly before
  turning it on an account you do not control.
- `admin`, a random password generated at container start, role `admin`.
  Nobody is given this password, and the reset flow is the only way to
  change it.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. `GET /admin` reads it, but only for a session logged
in as an account with the `admin` role.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f predictable-reset-token/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl http://localhost:8080/time
```

From there, the account to target is `admin`, the recipe above is the only
input you need, and `/time` keeps your clock aligned with the server's.
Working out the token for a chosen minute, confirming a reset for `admin`
with a password you choose, and logging in gets you to `GET /admin`,
which is where the flag lives.

Tear the lab down with:

```bash
docker compose -f predictable-reset-token/compose.yml down -v
```
