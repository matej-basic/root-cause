import os
import sqlite3
import uuid

from flask import Flask, jsonify, request, session

DB_PATH = os.environ.get("DB_PATH", "/app/store.db")

STARTING_BALANCE_CENTS = 5000
MAX_QTY_PER_LINE = 20

app = Flask(__name__)
# Session secret is per-container and only signs the login cookie; it plays
# no part in the lab's vulnerability.
app.secret_key = os.urandom(24)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def money(cents):
    sign = "-" if cents < 0 else ""
    cents = abs(cents)
    return f"{sign}{cents // 100}.{cents % 100:02d}"


def cart_view(conn, sid):
    rows = conn.execute(
        "SELECT c.sku, i.name, i.price_cents, c.qty "
        "FROM cart_lines c JOIN items i ON i.sku = c.sku "
        "WHERE c.sid = ? ORDER BY c.sku",
        (sid,),
    ).fetchall()
    lines = []
    total = 0
    for r in rows:
        line_total = r["price_cents"] * r["qty"]
        total += line_total
        lines.append(
            {
                "sku": r["sku"],
                "name": r["name"],
                "unit_price": money(r["price_cents"]),
                "qty": r["qty"],
                "line_total": money(line_total),
            }
        )
    return lines, total


@app.get("/")
def index():
    return (
        "Root Cause lab: merch store.\n"
        "POST /login with any username/password to open a shopper session "
        "with a starting wallet.\n"
        "GET /items lists the catalog, GET /wallet shows your balance.\n"
        'POST /cart with JSON {"sku": ..., "qty": ...} sets a cart line, '
        "GET /cart shows the cart, POST /checkout buys it.\n"
    )


@app.post("/login")
def login():
    # Demo store: any credentials are accepted. There is no password check
    # on purpose, this lab's bug is not about authentication.
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


@app.get("/cart")
def get_cart():
    sid = session.get("sid")
    if sid is None:
        return jsonify({"error": "login required"}), 401
    conn = get_db()
    lines, total = cart_view(conn, sid)
    conn.close()
    return jsonify({"lines": lines, "total": money(total)})


@app.post("/cart")
def set_cart_line():
    sid = session.get("sid")
    if sid is None:
        return jsonify({"error": "login required"}), 401

    data = request.get_json(silent=True) or {}
    sku = data.get("sku")
    qty = data.get("qty")

    if isinstance(qty, bool) or not isinstance(qty, int):
        return jsonify({"error": "qty must be an integer"}), 400

    # Vulnerable configuration (business logic): the quantity is capped on
    # the way up, so nobody can order a truckload of mugs, but there is no
    # lower bound. A negative quantity is stored as given and later summed
    # into the order total like any other line.
    if qty > MAX_QTY_PER_LINE:
        return jsonify({"error": f"max {MAX_QTY_PER_LINE} per item"}), 400

    conn = get_db()
    item = conn.execute("SELECT sku FROM items WHERE sku = ?", (sku,)).fetchone()
    if item is None:
        conn.close()
        return jsonify({"error": "unknown sku"}), 404

    if qty == 0:
        conn.execute("DELETE FROM cart_lines WHERE sid = ? AND sku = ?", (sid, sku))
    else:
        conn.execute(
            "INSERT INTO cart_lines (sid, sku, qty) VALUES (?, ?, ?) "
            "ON CONFLICT(sid, sku) DO UPDATE SET qty = excluded.qty",
            (sid, sku, qty),
        )
    conn.commit()
    lines, total = cart_view(conn, sid)
    conn.close()
    return jsonify({"lines": lines, "total": money(total)})


@app.post("/checkout")
def checkout():
    sid = session.get("sid")
    if sid is None:
        return jsonify({"error": "login required"}), 401

    conn = get_db()
    lines, total = cart_view(conn, sid)
    if not lines:
        conn.close()
        return jsonify({"error": "cart is empty"}), 400

    balance = conn.execute(
        "SELECT balance_cents FROM wallets WHERE sid = ?", (sid,)
    ).fetchone()["balance_cents"]

    if total > balance:
        conn.close()
        return (
            jsonify(
                {
                    "error": "insufficient funds",
                    "total": money(total),
                    "balance": money(balance),
                }
            ),
            402,
        )

    # Deliver the contents of every purchased line, then settle the wallet
    # and empty the cart.
    delivered = []
    for line in lines:
        if line["qty"] > 0:
            contents = conn.execute(
                "SELECT contents FROM items WHERE sku = ?", (line["sku"],)
            ).fetchone()["contents"]
            delivered.append(
                {"sku": line["sku"], "qty": line["qty"], "contents": contents}
            )

    new_balance = balance - total
    conn.execute(
        "UPDATE wallets SET balance_cents = ? WHERE sid = ?", (new_balance, sid)
    )
    conn.execute("DELETE FROM cart_lines WHERE sid = ?", (sid,))
    conn.commit()
    conn.close()
    return jsonify(
        {
            "status": "order placed",
            "charged": money(total),
            "balance": money(new_balance),
            "delivered": delivered,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
