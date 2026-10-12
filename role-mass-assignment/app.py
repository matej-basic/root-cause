import os

from flask import Flask, jsonify, request, session

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)
# Fixed secret: fine for a single-process lab, not a production pattern.
app.secret_key = "root-cause-role-mass-assignment"

# Single seeded account. Credentials are intentionally handed out; the bug
# this lab teaches is not about guessing a login.
USERS = {
    "alice": {
        "password": "password123",
        "profile": {
            "username": "alice",
            "email": "alice@example.com",
            "role": "user",
        },
    }
}


def current_user():
    username = session.get("username")
    return USERS.get(username)


@app.route("/")
def index():
    return (
        "Root Cause lab: profile settings API.\n"
        "Log in at POST /login (alice / password123), then manage your\n"
        "account at GET/PATCH /profile. GET /admin is for admins only.\n"
    )


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "invalid credentials"}), 401
    session["username"] = username
    return jsonify(user["profile"])


@app.route("/profile", methods=["GET"])
def get_profile():
    user = current_user()
    if not user:
        return jsonify({"error": "login required"}), 401
    return jsonify(user["profile"])


@app.route("/profile", methods=["PATCH"])
def update_profile():
    user = current_user()
    if not user:
        return jsonify({"error": "login required"}), 401
    updates = request.get_json(silent=True) or {}
    # Vulnerable: every field the client sends is copied straight onto the
    # stored profile, with no allow-list of which fields a user may change.
    user["profile"].update(updates)
    return jsonify(user["profile"])


@app.route("/admin", methods=["GET"])
def admin():
    user = current_user()
    if not user:
        return jsonify({"error": "login required"}), 401
    if user["profile"].get("role") != "admin":
        return jsonify({"error": "forbidden"}), 403
    with open(FLAG_PATH) as f:
        flag = f.read().strip()
    return jsonify({"flag": flag})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
