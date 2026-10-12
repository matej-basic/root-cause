import os
import sqlite3
import time
import uuid

from flask import Flask, jsonify, request, session

DB_PATH = os.environ.get("DB_PATH", "/app/store.db")

STARTING_BALANCE_CENTS = 500  # $5.00
REDEEM_DELAY_SECONDS = 0.3

app = Flask(__name__)
# Session secret is per-container and only signs the login cookie; it plays
# no part in the lab's vulnerability.
app.secret_key = os.urandom(24)


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def money(cents):
    sign = "-" if cents < 0 else ""
    cents = abs(cents)
    return f"{sign}{cents // 100}.{cents % 100:02d}"


@app.get("/")
def index():
    return (
        "Root Cause lab: gift card wallet.\n"
        "POST /login with any username/password to open a shopper session "
        "with a starting wallet.\n"
        "GET /wallet shows your balance, GET /items lists the catalog.\n"
        'POST /redeem with JSON {"code": ...} credits a gift card to your '
        "wallet.\n"
        'POST /purchase with JSON {"sku": ...} buys a catalog item if your '
        "balance covers it.\n"
    )


@app.post("/login")
def login():
    # Demo wallet: any credentials are accepted. This lab's bug is not
    # about authentication.
    data = request.get_json(silent=True) or request.form
    username = (data or {}).get("username", "demo")
    sid = str(uuid.uuid4())
    session["sid"] = sid
    conn = get_db()
    conn.execute(
        "INSERT INTO wallets (sid, balance_cents) VALUES (?, ?)",
        (sid, STARTING_BALANCE_CENTS),
    )
    conn.commit()
    conn.close()
    return jsonify(
        {"status": "ok", "username": username, "balance": money(STARTING_BALANCE_CENTS)}
    )


@app.get("/wallet")
def wallet():
    sid = session.get("sid")
    if sid is None:
        return jsonify({"error": "login required"}), 401
    conn = get_db()
    row = conn.execute(
        "SELECT balance_cents FROM wallets WHERE sid = ?", (sid,)
    ).fetchone()
    conn.close()
    return jsonify({"balance": money(row["balance_cents"])})


@app.get("/items")
def list_items():
    conn = get_db()
    rows = conn.execute(
        "SELECT sku, name, price_cents FROM items ORDER BY price_cents"
    ).fetchall()
    conn.close()
    return jsonify(
        [
            {"sku": r["sku"], "name": r["name"], "price": money(r["price_cents"])}
            for r in rows
        ]
    )


@app.post("/redeem")
def redeem():
    sid = session.get("sid")
    if sid is None:
        return jsonify({"error": "login required"}), 401

    data = request.get_json(silent=True) or {}
    code = data.get("code")
    if not code:
        return jsonify({"error": "code required"}), 400

    conn = get_db()
    card = conn.execute(
        "SELECT code, value_cents, used FROM giftcards WHERE code = ?", (code,)
    ).fetchone()
    if card is None:
        conn.close()
        return jsonify({"error": "invalid code"}), 404
    if card["used"]:
        conn.close()
        return jsonify({"error": "code already used"}), 409

    # Vulnerable configuration (race condition / TOCTOU): the code was just
    # read as unused, but the "used" flag is not written until after a
    # simulated processing delay (think: a fraud-check call to a partner
    # service). Any request that reaches this point while the flag is still
    # unset sails through the check above, no matter how many other
    # requests for the same code are doing the exact same thing right now.
    time.sleep(REDEEM_DELAY_SECONDS)

    conn.execute(
        "UPDATE wallets SET balance_cents = balance_cents + ? WHERE sid = ?",
        (card["value_cents"], sid),
    )
    conn.execute("UPDATE giftcards SET used = 1 WHERE code = ?", (code,))
    conn.commit()
    new_balance = conn.execute(
        "SELECT balance_cents FROM wallets WHERE sid = ?", (sid,)
    ).fetchone()["balance_cents"]
    conn.close()
    return jsonify(
        {
            "status": "redeemed",
            "credited": money(card["value_cents"]),
            "balance": money(new_balance),
        }
    )


@app.post("/purchase")
def purchase():
    sid = session.get("sid")
    if sid is None:
        return jsonify({"error": "login required"}), 401

    data = request.get_json(silent=True) or {}
    sku = data.get("sku")

    conn = get_db()
    item = conn.execute(
        "SELECT sku, name, price_cents, contents FROM items WHERE sku = ?", (sku,)
    ).fetchone()
    if item is None:
        conn.close()
        return jsonify({"error": "unknown sku"}), 404

    balance = conn.execute(
        "SELECT balance_cents FROM wallets WHERE sid = ?", (sid,)
    ).fetchone()["balance_cents"]

    if item["price_cents"] > balance:
        conn.close()
        return (
            jsonify(
                {
                    "error": "insufficient funds",
                    "price": money(item["price_cents"]),
                    "balance": money(balance),
                }
            ),
            402,
        )

    new_balance = balance - item["price_cents"]
    conn.execute(
        "UPDATE wallets SET balance_cents = ? WHERE sid = ?", (new_balance, sid)
    )
    conn.commit()
    conn.close()
    return jsonify(
        {
            "status": "purchased",
            "sku": item["sku"],
            "charged": money(item["price_cents"]),
            "balance": money(new_balance),
            "contents": item["contents"],
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=True)
