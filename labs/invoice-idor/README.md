# invoice-idor

## Vulnerability description

This lab is a broken access control bug, the class usually filed as IDOR
(insecure direct object reference), or missing object-level authorization in
OWASP's API security list. It shows up in any endpoint that fetches a record
by an id taken from the request, then returns it without checking that the
id actually belongs to the caller.

The flaw is not in a library or a framework version, it is a design choice
in the application's own handler. Authentication can be entirely correct,
the session can be exactly who it says it is, and the bug still lets that
session reach data that was never meant for it, as long as the object ids
are guessable and the ownership check is missing. Sequential integer ids,
the default in most ORMs and most tutorials, make the guessing part trivial.

## Vulnerable configuration

This lab is a small Flask + sqlite3 billing portal. A customer logs in (the
portal accepts a demo login, since the point of the lab is what happens
after that) and can list their own invoices, and fetch one by id:

```python
@app.get("/invoice/<int:invoice_id>")
def get_invoice(invoice_id):
    if session.get("customer_id") is None:
        return jsonify({"error": "login required"}), 401

    row = conn.execute(
        "SELECT id, customer_id, customer_name, amount_due, status, notes "
        "FROM invoices WHERE id = ?",
        (invoice_id,),
    ).fetchone()
    ...
```

The handler checks that *someone* is logged in, then fetches the invoice by
id alone. It never checks that `row.customer_id` matches the logged-in
session's `customer_id`. The listing endpoint, `/invoices`, does filter by
the session's own customer, so the portal looks correctly scoped as long as
you only ever click through its own links. The detail endpoint is where the
check was dropped.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume. Before the app starts, an entrypoint step seeds that flag into
the billing database as the `notes` field of an invoice, alongside a few
ordinary ones for the demo customer. The `challenge` container then serves
the portal on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f invoice-idor/compose.yml up
```

Once it is up:

```bash
curl -c cookies.txt -X POST http://localhost:8080/login -d username=demo -d password=anything
curl -b cookies.txt http://localhost:8080/invoices
```

`/invoices` only ever returns invoices for the demo customer, because that
endpoint filters by the session's own id.

From there, `GET /invoice/<id>` is your entry point. Your own invoices sit
at ids in the low thousands, for example one around 1042. Ids are handed out
sequentially and nothing stops you from asking for one you were not handed.
Somewhere well below your own range sits an invoice that was never meant to
be reachable from outside.

Tear the lab down with:

```bash
docker compose -f invoice-idor/compose.yml down -v
```
