import os

from flask import Flask, jsonify, make_response, request
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)

# Fixed key generated once at boot: fine for a single-process lab, not a
# production pattern. AES-ECB, 16-byte blocks, no IV (ECB has none).
KEY = get_random_bytes(16)

MAX_USERNAME_LEN = 64


def encode_profile(username: str) -> bytes:
    plaintext = f"user={username}&role=user".encode("utf-8")
    cipher = AES.new(KEY, AES.MODE_ECB)
    return cipher.encrypt(pad(plaintext, AES.block_size))


def decode_profile(token_hex: str):
    try:
        raw = bytes.fromhex(token_hex)
    except ValueError:
        return None
    if not raw or len(raw) % AES.block_size != 0:
        return None
    cipher = AES.new(KEY, AES.MODE_ECB)
    try:
        plaintext = unpad(cipher.decrypt(raw), AES.block_size)
    except ValueError:
        return None
    try:
        text = plaintext.decode("utf-8")
    except UnicodeDecodeError:
        return None
    fields = {}
    for part in text.split("&"):
        if "=" not in part:
            continue
        key, _, value = part.partition("=")
        fields[key] = value
    return fields


@app.route("/")
def index():
    return (
        "Root Cause lab: profile cookie service.\n"
        "POST /register {\"username\": \"...\"} to get a session cookie,\n"
        "then GET /profile to see how it reads back and GET /admin for the\n"
        "admin-only view.\n"
    )


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    if not isinstance(username, str) or not username:
        return jsonify({"error": "username required"}), 400
    if len(username) > MAX_USERNAME_LEN:
        return jsonify({"error": f"username too long (max {MAX_USERNAME_LEN})"}), 400
    if any(ord(c) > 127 for c in username):
        return jsonify({"error": "username must be ASCII"}), 400
    # The only characters the profile format itself depends on are blocked.
    # Nothing else about the username is filtered or escaped.
    if "&" in username or "=" in username:
        return jsonify({"error": "username may not contain '&' or '='"}), 400

    token = encode_profile(username).hex()
    resp = make_response(jsonify({"username": username, "role": "user"}))
    resp.set_cookie("session", token, httponly=False)
    return resp


@app.route("/profile", methods=["GET"])
def profile():
    token = request.cookies.get("session")
    if not token:
        return jsonify({"error": "no session cookie, POST /register first"}), 401
    fields = decode_profile(token)
    if fields is None:
        return jsonify({"error": "invalid session cookie"}), 400
    return jsonify(fields)


@app.route("/admin", methods=["GET"])
def admin():
    token = request.cookies.get("session")
    if not token:
        return jsonify({"error": "no session cookie, POST /register first"}), 401
    fields = decode_profile(token)
    if fields is None:
        return jsonify({"error": "invalid session cookie"}), 400
    if fields.get("role") != "admin":
        return jsonify({"error": "forbidden"}), 403
    with open(FLAG_PATH) as f:
        flag = f.read().strip()
    return jsonify({"flag": flag})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
