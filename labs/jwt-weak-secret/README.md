# jwt-weak-secret

## Vulnerability description

`jwt-weak-secret` is a hand-built lab, not a CVE. It is a companion to
`jwt-alg-none`, and the two make a useful pair: that lab breaks because the
verifier does not pin down which signing algorithm it trusts; this one pins
the algorithm correctly and breaks somewhere else entirely, in the strength
of the signing key itself.

HS256, the algorithm behind a typical JWT session token, is just HMAC-SHA256
with the server's secret as the key. The signature proves nothing about who
issued a token beyond "whoever holds this secret". If that secret is a
short, common, guessable string instead of a long random value, the proof
is only as strong as the secret is hard to find. Recovering it turns
anyone into the token issuer: a HS256 session scheme is exactly as safe as
its key is unguessable, not as safe as its algorithm is strong.

## Vulnerable configuration

`POST /login` hands out a token for a fixed guest account with
`{"user": "guest", "admin": false}`, signed with HS256. `GET /admin`
expects that token as a Bearer credential and returns a flag once it
decides the decoded claims say `admin` is true.

Unlike `jwt-alg-none`, the verify call here does the right thing: it pins
an explicit algorithm allow-list, so a token with a different or missing
algorithm, or a wrong signature, is rejected outright. The pinned
dependency is a current `jsonwebtoken` release, well past the bugs that
made the `alg:none` lab possible. None of that matters once the signing
secret itself is weak enough to search by machine.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. `/admin` reads it from there, but only once it decides
the token it was handed belongs to an admin.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f jwt-weak-secret/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl -X POST http://localhost:8080/login
```

From there, `/login` shows you a real, correctly signed guest token and
`/admin` is the gate behind it. The signature really is checked, and the
algorithm really is pinned, so neither of those is where this one gives.
Look instead at what kind of value a signing secret needs to be to resist
being searched for, and at what it takes to go from a token you were
handed to one you signed yourself. Getting from the guest token to one
`/admin` accepts as an administrator, without the server ever handing you
the secret, is the exercise.

Tear the lab down with:

```bash
docker compose -f jwt-weak-secret/compose.yml down -v
```
