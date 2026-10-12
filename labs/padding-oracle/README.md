# padding-oracle

## Vulnerability description

`padding-oracle` is a hand-built lab, not a CVE. It reproduces the bug
class behind a long line of real-world breaks (TLS record-layer attacks,
ASP.NET viewstate, countless home-rolled token formats): a CBC padding
oracle. Where the sibling lab `ecb-cookie-cutpaste` abuses ECB's
block-reuse to splice ciphertexts together, this one never reuses a
block at all; it asks the server, one byte at a time, whether a modified
ciphertext still decrypts to valid padding.

AES in CBC mode decrypts each block and XORs it with the previous
ciphertext block, so flipping a byte in block *N* flips the matching
byte of block *N+1*'s plaintext. Before the plaintext is used, the
PKCS7 padding is checked and stripped: the last byte says how many
padding bytes there are, and they must all carry that same value. When
an application answers "bad padding" differently from "padding fine but
the content is junk", that one bit of information is enough to recover
the full plaintext of any ciphertext the attacker holds, byte by byte,
without ever touching the key.

This service mints an "admin token" at boot: a JSON document containing
the flag, encrypted with AES-128-CBC under a key generated once and kept
in memory, with a random IV prepended. The front page proudly displays
the ciphertext. It also offers to decrypt any blob you hand it, and its
answers are where it goes wrong.

## Vulnerable configuration

`GET /` shows the hex-encoded admin token (IV plus ciphertext blocks).
`POST /decrypt` takes a JSON `{"blob": "<hex>"}`, decrypts it under the
server's key, and answers with three distinguishable outcomes: HTTP 200
when the padding is valid and the plaintext parses as a token, HTTP 400
`{"error": "bad padding"}` when the PKCS7 check fails, and HTTP 422
`{"error": "malformed token"}` when the padding is fine but the
plaintext is not a token. The split between "bad padding" and everything
else is the oracle: each query reveals whether the last bytes of the
decrypted block satisfy the padding rule.

The key is generated fresh at boot and never leaves the process, so
recovering it is not the point. There is no rate limiting and no timing
dependence; the attack is a deterministic byte-at-a-time walk over the
block pairs of the token shown on the front page. A 200 response never
contains the flag: recovering the plaintext is the whole exercise, and
the flag is read out of it locally.

The per-run flag is written by the Root Cause flagger to
`/flag/flag.txt` on a shared volume. The app reads it once at boot,
builds the admin token plaintext from it in memory, and encrypts it.
Nothing about the flag or the key is baked into the image.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f padding-oracle/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl -X POST http://localhost:8080/decrypt -H 'Content-Type: application/json' -d '{"blob": "00"}'
```

Take the admin token off the front page, flip bytes in the block before
the last one, and watch which answer comes back. When "bad padding"
turns into "malformed token", you have just forced the decrypted tail to
be a valid padding pattern, and that tells you exactly what the last
plaintext byte is. Chained over every block pair, that is the whole
token.

Tear the lab down with:

```bash
docker compose -f padding-oracle/compose.yml down -v
```
