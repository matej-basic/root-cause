# login-sqli

## Vulnerability description

`login-sqli` is a hand-built lab, not a CVE. It reproduces the most common
real-world finding in internal web apps: a login form whose query is built by
string formatting instead of bound parameters.

The scenario is a staff login portal for a fictional logistics company,
Harbor. Sign in at `/login` and the server runs a query shaped like this:

```python
query = "SELECT * FROM users WHERE user='%s' AND pass='%s'" % (user, pw)
```

Both form fields land inside the SQL text the server executes, not just as
values bound to it. Anything a client sends in `user` or `pass` is
interpreted as part of the query, which opens two separate issues: an
attacker can change the query's logic to bypass the password check
entirely, and, once a query returns attacker-chosen data, a `UNION SELECT`
can pull rows from a table the login page was never meant to expose.

A demo account exists so a normal login can be tested: `jsmith` /
`Harbor2024!`. Logging in as `jsmith` reaches the staff dashboard and shows
only that account's own row, nothing else.

## Vulnerable configuration

The query construction in `app.py` is the entire vulnerability. There is no
WAF, no input filtering, and no parameterized query anywhere in the request
path. `/login` is the only entry point that touches the database, and the
same string-built query runs on every submission, whether the request came
from the login form or from a client crafting the `user`/`pass` fields by
hand.

The per-run flag is never read by `app.py`. An entrypoint step
(`seed_db.py`) reads it from `/flag/flag.txt`, written there by the Root
Cause flagger on a shared volume, and inserts it as a row in a `secrets`
table before the Flask app starts. The login query only ever touches
`users`. Reaching the `secrets` row through the injection is the exercise.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume; the `challenge` container seeds the database from that file
and then serves the vulnerable app on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f login-sqli/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

From there, `/login` is your entry point. Working out which character
closes the quoted string and comments out the rest of the query gets you
past the password check. From a bypassed session, the dashboard renders
whatever columns a query returns, which is also the way out: a `UNION
SELECT` over the right number of columns can pull a value from the
`secrets` table instead of `users`.

Tear the lab down with:

```bash
docker compose -f login-sqli/compose.yml down -v
```
