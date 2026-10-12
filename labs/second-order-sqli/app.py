import os
import sqlite3

from flask import Flask, jsonify, request, session

# The seeded sqlite file. seed_db.py (run by the entrypoint before this app
# starts) creates it and loads the admin account (whose `note` column holds
# the per-run flag) plus a demo user.
DB_PATH = os.environ.get("DB_PATH", "/app/data.db")

app = Flask(__name__)
# Fixed secret: fine for a single-process lab, not a production pattern.
app.secret_key = "root-cause-second-order-sqli"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def current_user(conn):
    uid = session.get("uid")
    if uid is None:
        return None
    return conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()


@app.route("/")
def index():
    return (
        "Harbor Logistics - customer self-service portal.\n"
        "POST /register {username, password, email} to open an account.\n"
        "POST /login {username, password} to sign in.\n"
        "POST /email/change {email} to update the email on your account.\n"
        "POST /reset/request {email} to start a password reset.\n"
        "POST /reset/confirm {token, new_password} to set a new password.\n"
        "GET /profile shows your account record.\n"
    )


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")
    email = data.get("email", "")
    if not username or not password or not email:
        return jsonify({"error": "username, password and email are required"}), 400

    conn = get_db()
    try:
        # Safe: the registration INSERT binds every field as a parameter, so
        # nothing in the username is interpreted as SQL here. Whatever the
        # client sends is stored verbatim.
        conn.execute(
            "INSERT INTO users (username, password, email, role, note)"
            " VALUES (?, ?, ?, 'customer', '')",
            (username, password, email),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "username already taken"}), 409
    finally:
        conn.close()
    return jsonify({"message": "account created"})


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")

    conn = get_db()
    try:
        # Safe: the login lookup binds both fields as parameters.
        row = conn.execute(
            "SELECT * FROM users WHERE username=? AND password=?",
            (username, password),
        ).fetchone()
    finally:
        conn.close()

    if not row:
        return jsonify({"error": "invalid credentials"}), 401
    session["uid"] = row["id"]
    return jsonify({"username": row["username"], "role": row["role"]})


@app.route("/email/change", methods=["POST"])
def change_email():
    data = request.get_json(silent=True) or {}
    new_email = data.get("email", "")
    if not new_email:
        return jsonify({"error": "email is required"}), 400

    conn = get_db()
    try:
        user = current_user(conn)
        if not user:
            return jsonify({"error": "login required"}), 401

        # Vulnerable: the username is read back out of the database and then
        # spliced into the UPDATE by string formatting, because the column is
        # "trusted" data that was parameterized on the way in. Only the new
        # email is bound. Whatever was stored as the username at registration
        # time is SQL text here, in a completely different request.
        query = "UPDATE users SET email=? WHERE username='%s'" % user["username"]
        conn.execute(query, (new_email,))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"message": "email updated"})


@app.route("/reset/request", methods=["POST"])
def reset_request():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")

    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id FROM users WHERE email=?", (email,)
        ).fetchone()
        if not row:
            # Same response whether or not the address is registered, so
            # this endpoint cannot be used to enumerate accounts.
            return jsonify({"message": "if that address is registered, a reset email was sent"})

        token = os.urandom(16).hex()
        conn.execute("INSERT INTO resets (token, user_id) VALUES (?, ?)", (token, row["id"]))
        conn.commit()
    finally:
        conn.close()

    # This build runs without an SMTP server, so the reset email body is
    # returned in the response instead of being delivered.
    return jsonify(
        {
            "message": "if that address is registered, a reset email was sent",
            "email_preview": {"to": email, "body": "your reset token is %s" % token},
        }
    )


@app.route("/reset/confirm", methods=["POST"])
def reset_confirm():
    data = request.get_json(silent=True) or {}
    token = data.get("token", "")
    new_password = data.get("new_password", "")
    if not token or not new_password:
        return jsonify({"error": "token and new_password are required"}), 400

    conn = get_db()
    try:
        row = conn.execute(
            "SELECT user_id FROM resets WHERE token=?", (token,)
        ).fetchone()
        if not row:
            return jsonify({"error": "invalid or expired token"}), 400
        # Safe: both writes below bind their values as parameters.
        conn.execute(
            "UPDATE users SET password=? WHERE id=?", (new_password, row["user_id"])
        )
        conn.execute("DELETE FROM resets WHERE token=?", (token,))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"message": "password updated"})


@app.route("/profile")
def profile():
    conn = get_db()
    try:
        user = current_user(conn)
        if not user:
            return jsonify({"error": "login required"}), 401
        return jsonify(
            {
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "note": user["note"],
            }
        )
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
