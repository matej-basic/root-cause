import os
import sqlite3

from flask import Flask, jsonify, request, session

DB_PATH = os.environ.get("DB_PATH", "/app/billing.db")

app = Flask(__name__)
# Session secret is per-container and only signs the login cookie; it plays
# no part in the lab's vulnerability.
app.secret_key = os.urandom(24)

DEMO_CUSTOMER_ID = 4471
DEMO_CUSTOMER_NAME = "Acme Retail Ltd."


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/")
def index():
    return (
        "Root Cause lab: billing portal.\n"
        "POST /login with any username/password to start a demo customer "
        "session, then GET /invoices for your invoice list and "
        "GET /invoice/<id> for a single invoice.\n"
    )


@app.post("/login")
def login():
    # Demo portal: any credentials are accepted and mapped to the one demo
    # customer account. There is no password check here on purpose, this
    # lab's bug is not about authentication.
    data = request.get_json(silent=True) or request.form
    username = (data or {}).get("username", "demo")
    session["customer_id"] = DEMO_CUSTOMER_ID
    session["customer_name"] = DEMO_CUSTOMER_NAME
    return jsonify({"status": "ok", "logged_in_as": DEMO_CUSTOMER_NAME, "username": username})


@app.post("/logout")
def logout():
    session.clear()
    return jsonify({"status": "ok"})


@app.get("/invoices")
def list_invoices():
    customer_id = session.get("customer_id")
    if customer_id is None:
        return jsonify({"error": "login required"}), 401

    conn = get_db()
    rows = conn.execute(
        "SELECT id, customer_id, customer_name, amount_due, status FROM invoices "
        "WHERE customer_id = ? ORDER BY id",
        (customer_id,),
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.get("/invoice/<int:invoice_id>")
def get_invoice(invoice_id):
    if session.get("customer_id") is None:
        return jsonify({"error": "login required"}), 401

    # Vulnerable configuration (IDOR): the invoice is fetched by its id alone.
    # There is no check that the invoice's customer_id matches the logged-in
    # session's customer_id, so any authenticated session can read any
    # invoice just by knowing or guessing its id.
    conn = get_db()
    row = conn.execute(
        "SELECT id, customer_id, customer_name, amount_due, status, notes "
        "FROM invoices WHERE id = ?",
        (invoice_id,),
    ).fetchone()
    conn.close()

    if row is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(dict(row))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
