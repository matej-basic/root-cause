# blind-sqli-tracker

## Vulnerability description

`blind-sqli-tracker` is a hand-built lab, not a CVE. It is the same family of
bug as `login-sqli`, a string-formatted SQL query, but with the usual
shortcut removed: nothing from the query ever reaches the response. The page
only ever says one of two things, found or not found.

The scenario is a package-tracking lookup for the same fictional company,
Harbor Logistics. Paste in a tracking code and the server runs a query
shaped like this:

```python
query = "SELECT tracking FROM packages WHERE tracking='%s'" % code
```

The tracking code lands inside the SQL text the server executes, exactly
like the login form in `login-sqli`. The difference is what the attacker
gets back: no rows, no columns, no error message, just a binary "Package
found" or "No package found with that tracking code." That is enough. A
condition spliced into the query still changes which branch the page takes,
so the response itself becomes a one-bit oracle, and a query that can be
asked many times in a row can be turned into a byte-by-byte read of
anything else in the database.

A few demo tracking codes exist so a normal lookup can be tested, for
example `HBL10492837`. Looking one of those up returns "found" and nothing
else, same as any other code that happens to match.

## Vulnerable configuration

The query construction in `app.py` is the entire vulnerability, and so is
the response: a `sqlite3.Error` is caught and folded into the same "not
found" branch as a code that simply does not match, so the oracle never
leans on a stack trace or a distinct HTTP status to leak anything. There is
no WAF and no input filtering. `/track` is the only entry point that touches
the database.

The per-run flag is never read by `app.py`. An entrypoint step
(`seed_db.py`) reads it from `/flag/flag.txt`, written there by the Root
Cause flagger on a shared volume, and inserts it as a row in a `secrets`
table before the Flask app starts. The tracking query only ever touches
`packages`. Reaching the `secrets` row through the injection, one bit at a
time, is the exercise.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume; the `challenge` container seeds the database from that file
and then serves the vulnerable app on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f blind-sqli-tracker/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

From there, `/track` is your entry point, and it takes one field, `code`.
Confirm the injection point first: a code that closes the quote and adds a
condition still changes which of the two responses comes back, even though
neither response ever shows you a row. From there the question is how to
turn a single yes/no answer per request into a full string. SQLite has no
information_schema to walk, but it does have string functions, and a query
you already control the shape of can be pointed at `secrets` instead of
`packages`.

Scripting the extraction is the point of this lab; a single request will
not get you there. Once you can ask "is the flag's N-th character this
value" and trust the answer, recovering it is a loop, not a trick.

Tear the lab down with:

```bash
docker compose -f blind-sqli-tracker/compose.yml down -v
```
