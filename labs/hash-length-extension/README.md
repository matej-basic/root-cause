# hash-length-extension

## Vulnerability description

`hash-length-extension` is a hand-built lab, not a CVE. It reproduces a
bug class that shows up whenever an application builds its own request
signing out of a raw hash function: the secret-prefix MAC
`sha256(secret || data)` and the length-extension attack that breaks it.

Unlike the JWT labs on this platform, nothing here goes through a token
library: the "signature" is one line of `hashlib.sha256` over a secret
concatenated with the request string, which is exactly the pattern the
attack eats.

SHA-256 is a Merkle-Damgard hash. It chews the message in 64-byte blocks,
and the digest it returns is simply its full internal state after the
last block. The direct consequence: anyone holding `sha256(X)` for an
unknown `X` can pick the hash up where it left off and keep hashing more
blocks. Given only the MAC of `secret || data`, an attacker can compute
the valid MAC of `secret || data || padding || extra` for any `extra`
they choose, without ever learning the secret. The `padding` is not a
guess: it is the standard SHA-256 padding the server itself appended to
the original message, and its shape depends only on the length of
`secret || data`.

This app signs API requests that way. A visitor is handed a valid
signature for a low-privilege profile string. The admin endpoint
recomputes the MAC over whatever string it receives and trusts the role
it parses back out. The bug is not in how the role is checked. It is in
what a raw hash lets an attacker append to a signed message.

## Vulnerable configuration

`GET /sign` returns a signed example: the profile string
`role=user&uid=42`, its hex encoding, and its MAC,
`sha256(secret || data)` as hex. The secret is 16 random bytes generated
at container start, held only in memory, and never shown. Its length is
fixed and known; recovering the secret itself is not the point.

`POST /admin` takes JSON `{"data_hex": ..., "sig": ...}`, hex-decodes the
data, recomputes `sha256(secret || data)` and compares it to the supplied
signature in constant time. The data travels hex-encoded in a JSON body
so that arbitrary bytes survive the trip; a forged message contains raw
padding bytes that a query string would mangle. Only when the MAC
verifies does the server parse the data as `key=value` pairs joined by
`&` (later fields win) and serve the flag if `role` reads `admin`.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. The app reads it once at startup and holds it in
memory; `/admin` serves it only for a request whose MAC verifies and
whose parsed role is `admin`.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f hash-length-extension/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/sign
curl -X POST http://localhost:8080/admin -H 'Content-Type: application/json' \
  -d '{"data_hex": "726f6c653d75736572267569643d3432", "sig": "<sig from /sign>"}'
```

Fetch the signed example, confirm the unmodified request gets you a
`role=user` rejection from `/admin`, and think about what it means that a
SHA-256 digest is the whole internal state of the hash, not a sealed
result. Getting from the signature over `role=user&uid=42` to a signature
over a string that parses to `role=admin`, without ever learning the
secret, is the exercise. The SHA-256 round function is small enough to
continue by hand in a few dozen lines of Python; the padding you need to
bridge is the standard one, sized for a 16-byte secret.

Tear the lab down with:

```bash
docker compose -f hash-length-extension/compose.yml down -v
```
