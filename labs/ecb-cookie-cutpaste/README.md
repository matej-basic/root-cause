# ecb-cookie-cutpaste

## Vulnerability description

`ecb-cookie-cutpaste` is a hand-built lab, not a CVE. It reproduces a bug
class that shows up whenever an application rolls its own encrypted
session token and reaches for AES in ECB mode: block-reuse, often called a
"cut-and-paste" attack.

ECB encrypts a message one 16-byte block at a time, independently, with no
chaining between blocks. The direct consequence: two identical plaintext
blocks, anywhere in the message, always produce the same ciphertext block.
A mode that does this gives an attacker who can line up chosen plaintext
on block boundaries a set of ciphertext blocks that behave like reusable
Lego pieces, each one swappable for another from a different message
encrypted under the same key.

This app issues a session cookie that is the AES-ECB encryption of a small
profile string carrying the caller's username and role. The registration
endpoint builds that string from whatever username the caller supplies,
encrypts it, and hands the result back as the cookie. Nothing about the
role is ever taken from client input directly: a fresh account is always
`role=user`. The bug is not in how the role gets set. It is in what ECB
lets an attacker do to a ciphertext it already has.

## Vulnerable configuration

`POST /register` takes a JSON `{"username": "..."}`, builds a profile
string out of it, and returns a session cookie: the hex-encoded AES-ECB
ciphertext of that string, PKCS7-padded to the cipher's 16-byte block
size. `GET /profile` decrypts the caller's cookie and shows the fields it
parsed back out, which is useful for seeing the shape of the plaintext.
`GET /admin` decrypts the cookie, checks the `role` field, and returns the
flag only when it reads `admin`.

The only filtering on the username is against the two characters the
profile format itself depends on (`&` and `=`); nothing else about it is
restricted. The key is generated fresh at boot and never leaves the
process, so recovering it is not the point. The registration endpoint is
the only place a caller influences the plaintext that gets encrypted, and
AES-ECB's block-independence is the only property that matters from
there.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. `/admin` reads it from there, but only once it decides
the session cookie it was handed decrypts to an admin role.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f ecb-cookie-cutpaste/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
curl -X POST http://localhost:8080/register -H 'Content-Type: application/json' -d '{"username": "alice"}'
```

Register a couple of accounts, look at the cookies you get back and at
what `/profile` tells you about how they decrypt, and think about what it
means for an encryption mode to produce the same output block for the
same input block every time, regardless of what comes before or after it.
Getting from an ordinary registered account to a cookie `/admin` reads as
an administrator, without ever learning the encryption key, is the
exercise.

Tear the lab down with:

```bash
docker compose -f ecb-cookie-cutpaste/compose.yml down -v
```
