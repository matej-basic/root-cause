# jwt-alg-none

## Vulnerability description

`jwt-alg-none` is a hand-built lab, not a CVE. It reproduces a bug class
that keeps showing up in real APIs that roll their own JWT session
handling: a verifier that decodes a token without pinning down which
signing algorithm it is willing to accept.

The app issues a signed JWT at login carrying the caller's identity and an
`admin` flag. The admin endpoint reads that token back with the JWT
library's decode call, but without an algorithm allow-list. A JWT header
declares its own algorithm, and this decode call takes the header's word
for it. A token signed with `HS256`, a token signed with nothing at all
under `"alg": "none"`, and a token that lies about its algorithm in other
ways all reach the same code path, because the server never checks which
one it is actually looking at.

This is the "algorithm confusion" family of JWT bugs: the signature exists
to prove a token came from the server, but that only holds if the verifier
decides, on its own terms, which algorithms it trusts. A decode call that
instead trusts the token's own header has nothing left to check.

## Vulnerable configuration

`POST /login` hands out a token for a fixed guest account with
`{"user": "guest", "admin": false}`, signed with `HS256`. `GET /admin`
expects that token as a Bearer credential, decodes it, and returns a flag
if the decoded claims say `admin` is true.

The verify call in `app.js` is the entire vulnerability: it passes no
`algorithms` option, so it accepts whatever the token header claims
rather than enforcing `HS256`. The pinned dependency is
`jsonwebtoken@0.4.0` (see `package.json`), an early release that predates
both the library's later signature-presence check and its algorithms
allow-list (added in 4.2.2 to close CVE-2015-9235). `verify()` in this
release hands the token straight to its signing-algorithm implementation
with no check of its own, so an unsigned, `alg: none` token passes
unchanged. Later jsonwebtoken releases reject a token whose header
algorithm was not explicitly allowed.

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
docker compose -f jwt-alg-none/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl -X POST http://localhost:8080/login
```

From there, `/login` shows you the shape of a legitimate token and
`/admin` is the gate. Look at what the guest token actually carries, and
at what a JWT header is allowed to say about its own signature. Getting
from a guest token to one `/admin` accepts as an administrator, without
ever learning the signing secret, is the exercise.

Tear the lab down with:

```bash
docker compose -f jwt-alg-none/compose.yml down -v
```
