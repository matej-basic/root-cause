# nosql-login-bypass

## Vulnerability description

`nosql-login-bypass` is a hand-built lab, not a CVE. It teaches NoSQL
operator injection: a bug class that shows up whenever a login or lookup
handler forwards a parsed request body straight into a MongoDB query
instead of pulling out the specific fields it expects.

The scenario is a login API for a fictional fleet-dispatch tool, FleetChat.
Sign in at `POST /login` with a JSON body and the server runs something
shaped like this:

```js
const account = await usersCollection.findOne(credentials);
```

`credentials` is the request body, parsed as JSON and handed to `findOne`
untouched. In a SQL login query, a client only controls the *values* being
compared. Here, because MongoDB's query filters are themselves JSON
objects, a client that controls the body controls the *shape* of the
query. A field whose value is an object rather than a plain string is not
a string comparison anymore, it is a MongoDB query operator, and the
server never notices the difference.

A demo account exists so a normal login can be tested: `dispatcher` with
a password handed out alongside the lab. Logging in as `dispatcher` lands
on a plain dispatcher view, not the admin one.

## Vulnerable configuration

The query construction in `server.js` is the entire vulnerability. There
is no schema validation on the request body and no check that each field
is a plain string before it reaches the database driver. `/login` is the
only route that touches the `users` collection, and the same
`findOne(credentials)` call runs on every submission, whether the body
came from the login form a browser would send or from a client who built
the JSON by hand.

The app bundles its own MongoDB server inside the same container, started
by the entrypoint before the app listens, so the lab stays a single
`docker compose` service. An admin account is seeded with a long random
password that is never written down anywhere a student can read; getting
past `/login` as that account depends entirely on controlling the shape
of the query, not on guessing or leaking the password.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume, and `server.js` reads it once at startup, before it
has processed a single request. `GET /dashboard` only includes the flag
in its response once the current session belongs to the admin account.
Reaching that account without its password is the exercise.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container starts its bundled
MongoDB, seeds the `users` collection, and then serves the app on port
8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f nosql-login-bypass/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

From there, `POST /login` is your entry point. The request body is JSON,
and the server passes it to the database layer with no change to its
shape. Working out which field to turn from a plain string into an
object, and which comparison operator gets a query to match the admin
row without supplying its password, gets you into an admin session. From
there, `GET /dashboard` is the way out.

Tear the lab down with:

```bash
docker compose -f nosql-login-bypass/compose.yml down -v
```
