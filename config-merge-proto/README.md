# config-merge-proto

## Vulnerability description

This lab is a prototype pollution bug, not a CVE: the kind of flaw that
shows up whenever a Node app deep-merges untrusted JSON into a server-side
object with a hand-rolled recursive merge instead of a library that
guards against it.

The app exposes a small settings API. A POST handler takes the JSON body
of the request and walks it key by key, recursing into nested objects and
copying whatever it finds onto the matching key of a server config
object. The merge never checks which keys it is walking, so a key like
`__proto__` is handled exactly like any other property name. Nested far
enough, that lets a request reach `Object.prototype` itself rather than
the plain config object the author had in mind.

Once a property lands on `Object.prototype`, every plain object created
afterward inherits it, including objects that have nothing to do with the
settings API. An admin view elsewhere in the app decides access by
reading one property off a freshly created object. Normally that property
does not exist anywhere, so the check fails closed. After the pollution
it resolves through the prototype chain instead of failing, and the view
opens.

Recursive merge helpers like this are common in real settings, config and
"update preferences" endpoints. The fix is either an allow-list of
mergeable keys, a merge library that explicitly rejects `__proto__` and
`constructor`, or `Object.create(null)` for objects that should never
carry a prototype at all.

## Vulnerable configuration

`server.js` holds the whole app: the merge helper, the settings routes,
and the admin view. The merge helper is a dozen lines; the bug is in what
it does with arbitrary key names, not in any framework or library
version. The route structure mirrors the other Root Cause labs: an
unauthenticated settings API, and an admin route gated on a property of
an object.

The per-run flag is written by the Root Cause flagger to
`/flag/flag.txt` on a shared volume. The admin route reads it from there
and returns it, but only once the gate it checks resolves to true.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f config-merge-proto/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

Look at what the settings endpoint does with the body you send it, and
at what the admin route is actually checking before it hands back
anything. Getting from an anonymous request to the admin view, without
ever touching the config object the admin check is supposed to belong
to, is the exercise.

Tear the lab down with:

```bash
docker compose -f config-merge-proto/compose.yml down -v
```
