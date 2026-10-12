# second-order-sqli

## Vulnerability description

`second-order-sqli` is a hand-built lab, not a CVE. It reproduces second-order
(also called stored) SQL injection: the payload is written to the database in
one request, safely, and only becomes SQL when a later feature reads the
stored value back and builds a query with it. The contrast with
`login-sqli`, where the injected input fires in the same request that
carries it, is the whole point: parameterizing the entry point does not help
if a second code path trusts what came out of the database.

The scenario is a customer self-service portal for the same fictional
company as the other SQLi labs, Harbor Logistics. Registration binds every
field as a parameter, so any username is stored verbatim:

```python
conn.execute(
    "INSERT INTO users (username, password, email, role, note)"
    " VALUES (?, ?, ?, 'customer', '')",
    (username, password, email),
)
```

The change-email feature is where the stored value fires. It reads the
logged-in user's username back out of the database and splices it into the
UPDATE by string formatting:

```python
query = "UPDATE users SET email=? WHERE username='%s'" % user["username"]
```

A username like `admin' -- ` is harmless on the way in. On the way through
this query it closes the quoted string, so the UPDATE matches the `admin`
row instead of the attacker's own, and the `--` comments out the rest. The
attacker's "change my email" request rewrites the admin account's email to
an address the attacker controls. From there the password-reset flow does
the rest: request a reset for that address, set a new password on the admin
account, sign in, and read the admin profile, which carries the flag in its
`note` field.

A demo account exists so a normal session can be tested: `jsmith` /
`Harbor2024!`. Changing jsmith's email, resetting jsmith's password and
viewing jsmith's profile all behave as intended and never show the flag.

## Vulnerable configuration

The query construction in `/email/change` is the entire vulnerability.
Registration, login, the reset flow and the profile lookup are all
parameterized; the email value in the UPDATE is bound as well. The only
string-formatted piece is the stored username. There is no WAF and no input
filtering anywhere in the request path.

The seeded admin email is deliberately unguessable, and `/reset/request`
returns the same message whether or not an address is registered, so the
reset flow alone cannot be pointed at the admin account. This build runs
without an SMTP server, so a successful reset request returns the email body
in its JSON response; that is how a client who controls an address reads
the token.

The per-run flag is never read by `app.py`. An entrypoint step
(`seed_db.py`) reads it from `/flag/flag.txt`, written there by the Root
Cause flagger on a shared volume, and stores it in the `note` column of the
admin row before the Flask app starts. Reaching that column through the
stored username is the exercise.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume; the `challenge` container seeds the database from that file
and then serves the vulnerable app on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f second-order-sqli/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

From there, `/register` is your entry point. The account you open is stored
exactly as you send it, so the interesting question is what a later feature
does with your username once it is read back out of the database.
`/email/change` is the feature to look at: work out which username turns
"update my row" into "update a row that is not yours". The admin profile
holds the flag, and the reset flow is the way onto the admin account once
its email points at an address you control.

Tear the lab down with:

```bash
docker compose -f second-order-sqli/compose.yml down -v
```
