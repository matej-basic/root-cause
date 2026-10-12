# giftcard-race

## Vulnerability description

`giftcard-race` is a hand-built lab, not a CVE. It reproduces a race
condition in a business workflow: a check-then-act sequence that is correct
for one request at a time and wrong the moment two requests run at once.

The scenario is a small gift card wallet. A shopper logs in, gets a starting
balance, and can redeem a one-time gift card code for store credit. The
redeem handler looks, read in isolation, like reasonable code: confirm the
code has not been used yet, credit the wallet, then mark the code used. The
problem is in the gap between the first step and the last one. The server
reads the code's status, does some work, and only afterward writes "used"
back to storage. Any request that arrives while that gap is still open sees
the same "not used yet" status as the first one, regardless of how many
other requests are in that same gap right now.

This class of bug shows up anywhere a check and the update that should
follow it are split into separate steps with anything, a database round
trip, a network call, a queue, sitting in between: coupon and promo code
redemption, inventory reservation, withdrawal and transfer endpoints,
one-time-use tokens. The fix is never "add a cache" or "retry on conflict",
it is making the check and the update one atomic operation.

## Vulnerable configuration

The wallet starts with a small balance, well under the price of the
catalog's one premium item, the Flag Voucher. A single gift card redeem
adds store credit but still is not enough on its own to afford the
voucher, so an honest shopper who redeems the code once and tries to buy
the voucher is correctly turned down.

The redeem endpoint in `app.py` does the check and the write as two
separate database statements, with a deliberate pause in between standing
in for the kind of work a real redemption flow would do (a fraud check, a
partner API call):

```python
if card["used"]:
    return jsonify({"error": "code already used"}), 409

time.sleep(REDEEM_DELAY_SECONDS)

conn.execute("UPDATE wallets SET balance_cents = balance_cents + ? WHERE sid = ?", ...)
conn.execute("UPDATE giftcards SET used = 1 WHERE code = ?", (code,))
```

Nothing locks the gift card row between the read and the write, and the
app serves requests concurrently. `/redeem` is the entry point.

The per-run flag is never read by `app.py` directly. An entrypoint step
(`seed_db.py`) reads it from `/flag/flag.txt`, written there by the Root
Cause flagger on a shared volume, and stores it as the contents of the Flag
Voucher item before the Flask app starts. `/purchase` returns an item's
contents only once the wallet balance covers its price.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to the
shared `flag` volume; the `challenge` container seeds the database from
that file and then serves the wallet app on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f giftcard-race/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl -c cookies.txt -X POST http://localhost:8080/login -d username=demo -d password=anything
curl -b cookies.txt http://localhost:8080/wallet
curl http://localhost:8080/items
```

From there, `POST /redeem` with `{"code": "WELCOME10"}` credits the gift
card to your session's wallet, and `POST /purchase` with
`{"sku": "flag-voucher"}` buys an item if the balance covers it, returning
its contents in the response. One redeem will not get you there. The code
is only meant to work once; look at what actually stops it from working
twice, and when.

Tear the lab down with:

```bash
docker compose -f giftcard-race/compose.yml down -v
```
