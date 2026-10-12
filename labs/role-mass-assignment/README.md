# role-mass-assignment

## Vulnerability description

This lab is a broken access control bug, not a CVE: a mass assignment
flaw of the kind that shows up in real profile and settings APIs whenever
an update handler trusts the client's request body a little too much.

The app has a profile-settings endpoint that lets a logged-in user update
their own account. The handler takes the JSON body of the request and
merges it directly onto the stored user record, field by field, with no
allow-list of which fields a regular user is permitted to change. An
admin-only view elsewhere in the app decides access purely by reading one
of the fields on that same record.

Mass assignment bugs like this come from binding a request body straight
onto a model or object instead of picking out the fields a given endpoint
is actually meant to accept. Whatever the object happens to carry, the
client can set, including fields that were only ever meant to be set by
the server.

## Vulnerable configuration

The app seeds a single account (see `app.py`) and exposes a small JSON
API: logging in, reading your own profile, updating your own profile, and
an admin view. The update handler is a couple of lines; the bug is in
what it does with the request body rather than in any framework or
library version.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. The admin view reads it from there and returns it,
but only once it decides the logged-in account qualifies as an admin.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f role-mass-assignment/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

Log in with the credentials the app hands out, then look at what the
profile endpoint lets you read and write, and at what the admin view
checks before it hands back anything. Getting from an ordinary logged-in
account to the admin view, without ever being told the admin password, is
the exercise.

Tear the lab down with:

```bash
docker compose -f role-mass-assignment/compose.yml down -v
```
