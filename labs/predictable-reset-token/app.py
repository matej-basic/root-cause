import hashlib
import os
import time

from flask import Flask, jsonify, request, session

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)
# Fixed secret: fine for a single-process lab, not a production pattern.
app.secret_key = "root-cause-predictable-reset-token"

# Two seeded accounts. jsmith's password is handed out so the reset flow can
# be exercised honestly; admin's password is random and never revealed, so
# reaching the admin area means resetting admin's password first.
USERS = {
    "jsmith": {"password": "Meridian2024!", "role": "user"},
    "admin": {"password": os.urandom(16).hex(), "role": "admin"},
}

# Reset recipe (see README): token = md5(f"{username}:{minute}"), where
# minute is the server's current UTC time floored to whole minutes. A token
# is accepted for the minute it was computed for, or the one before it, so a
# request that lands right on a minute boundary still works.
TOKEN_WINDOW_MINUTES = 1


def current_minute():
    return int(time.time() // 60)


def expected_tokens(username):
    minute = current_minute()
    return {
        hashlib.md5(f"{username}:{m}".encode()).hexdigest()
        for m in range(minute - TOKEN_WINDOW_MINUTES, minute + 1)
    }


def current_user():
    username = session.get("username")
    return username, USERS.get(username)


@app.route("/")
def index():
    return (
        "Meridian Staffing - password self-service.\n"
        "POST /reset/request {username} to start a reset.\n"
        "POST /reset/confirm {username, token, new_password} to set a new password.\n"
        "POST /login {username, password} to sign in.\n"
        "GET /admin is for admins only.\n"
        "GET /time returns the server clock a reset token is computed against.\n"
    )


@app.route("/time")
def server_time():
    # Exposed so a client can compute the same minute value the server
    # uses, with no clock-skew guessing involved.
    return jsonify({"minute": current_minute()})


@app.route("/reset/request", methods=["POST"])
def reset_request():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    if username not in USERS:
        # Same response whether or not the account exists, so this endpoint
        # cannot be used to enumerate accounts.
        return jsonify({"message": "if that account exists, a reset email was sent"})

    # In a real deployment this would email a link containing the token.
    # Here the "email" is simply not delivered anywhere a client can read;
    # the token recipe is the published spec (see README), so a client who
    # knows the recipe can compute it without ever seeing the email.
    return jsonify({"message": "if that account exists, a reset email was sent"})


@app.route("/reset/confirm", methods=["POST"])
def reset_confirm():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    token = data.get("token")
    new_password = data.get("new_password")

    user = USERS.get(username)
    if not user or not token or not new_password:
        return jsonify({"error": "invalid request"}), 400

    if token not in expected_tokens(username):
        return jsonify({"error": "invalid or expired token"}), 400

    user["password"] = new_password
    return jsonify({"message": "password updated"})


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "invalid credentials"}), 401
    session["username"] = username
    return jsonify({"username": username, "role": user["role"]})


@app.route("/admin")
def admin():
    username, user = current_user()
    if not user:
        return jsonify({"error": "login required"}), 401
    if user["role"] != "admin":
        return jsonify({"error": "forbidden"}), 403
    with open(FLAG_PATH) as f:
        flag = f.read().strip()
    return jsonify({"flag": flag})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
