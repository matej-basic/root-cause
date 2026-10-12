# negative-quantity-checkout

## Vulnerability description

This lab is a business-logic flaw in input validation, specifically
quantity validation in a shopping cart. The class covers any workflow where
the code trusts a number from the client and a rule that seems obvious to a
human (you cannot buy less than nothing) was never written down as a check.

The flaw is not in a library or a framework version, it is a gap in the
application's own handler. Authentication works, prices come from the
server and cannot be tampered with, and the wallet check at checkout is
correct for the total it is given. The bug lives in what feeds that total,
and in how the total is built from the cart lines. Bugs like this are
behind real incidents in retail, ticketing and in-app purchase systems,
where an order total is a sum of client-influenced terms and nobody asked
what happens when a term has the wrong sign.

## Vulnerable configuration

This lab is a small Flask + sqlite3 merch store. A shopper logs in (the
store accepts a demo login, since the point of the lab is what happens
after that), gets a small wallet, and can set cart lines and check out:

```python
if qty > MAX_QTY_PER_LINE:
    return jsonify({"error": f"max {MAX_QTY_PER_LINE} per item"}), 400
```

The cart handler validates the quantity on the way up, so ordering a
truckload of mugs is refused. The checkout handler then sums the cart lines
and compares the result with the wallet balance:

```python
if total > balance:
    return jsonify({"error": "insufficient funds", ...}), 402
```

Both checks look reasonable on their own. The catalog has one expensive
item, the Vault Access Key, whose delivered contents are the flag. It
costs far more than the starting wallet, so an honest purchase is refused.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume. Before the app starts, an entrypoint step loads that flag
into the store database as the delivered contents of the Vault Access Key.
The `challenge` container then serves the store on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f negative-quantity-checkout/compose.yml up
```

Once it is up:

```bash
curl -c cookies.txt -X POST http://localhost:8080/login -d username=demo -d password=anything
curl -b cookies.txt http://localhost:8080/wallet
curl http://localhost:8080/items
```

From there, `POST /cart` with a JSON body such as
`{"sku": "mug", "qty": 2}` sets a cart line, `GET /cart` shows the lines and
the running total, and `POST /checkout` places the order. Items are
delivered in the checkout response. Your entry point is the cart: look at
what it will accept, and at what the total is built from.

Tear the lab down with:

```bash
docker compose -f negative-quantity-checkout/compose.yml down -v
```
