# graphql-idor

## Vulnerability description

`graphql-idor` is a hand-built lab, not a CVE. It is a small notes API over
GraphQL, and it carries two separate issues rather than one: introspection
left enabled on a server that presents itself as production, and an
object-level access flaw once you can see the schema.

Introspection is GraphQL's own schema reflection: ask the server what it
can do, and it tells you every type, field, and argument it defines,
including ones no page in the app ever calls. Plenty of real deployments
ship with introspection still on in production, because the framework
default favored developer convenience and nobody turned it off before
shipping. That alone is only a disclosure issue: it tells an outside caller
what the API looks like. It becomes a path to real data once a resolver
behind that schema is missing an authorization check, which is the second
bug here.

A signed-in user can list their own notes, and that listing is correctly
scoped to the caller. The schema also exposes a way to fetch a single note
directly, and that path checks nothing about who the note belongs to: it
returns whatever note matches the id it was given, regardless of who is
asking. Sequential, low-numbered ids make the gap easy to find once the
schema says it exists.

## Vulnerable configuration

The API is a Node + Apollo Server app (`server.js`, one file, no
framework beyond Apollo and `graphql`). It seeds a couple of accounts and
a handful of notes in memory at startup: a demo account with a few
ordinary notes, and an internal account with one note nothing in the UI
links to. The resolver for the full notes listing filters by the caller's
own account. The resolver for fetching a single note does not. Everything
is served at `/graphql`, the single entry point into the app.

The per-run flag is never read from disk by any request handler. It is
read once at container startup, from `/flag/flag.txt` on the shared
volume the Root Cause flagger writes to, and seeded as the body of that
internal account's note. Reaching it means going through the GraphQL API,
not the filesystem.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container seeds its in-memory
notes from that file and then serves the API on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f graphql-idor/compose.yml up
```

Once it is up, the API answers on `http://localhost:8080/graphql`:

```bash
curl -s http://localhost:8080/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ me { username } }"}'
```

From there, introspection is your way in: ask the schema what queries and
types exist, and it hands back every field, including the ones a normal
client walkthrough of the app would never reach. One of those fields
returns a note by id with no check on who is asking. Working out which
field that is, and which low id it was never supposed to hand you, is the
exercise. A signed-in user's own notes listing will not show you that
note; it is not yours.

Tear the lab down with:

```bash
docker compose -f graphql-idor/compose.yml down -v
```
