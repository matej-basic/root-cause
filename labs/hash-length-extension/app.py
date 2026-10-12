import hashlib
import hmac
import os
import secrets

from flask import Flask, jsonify, request

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)

# Random 16-byte secret generated once at boot, held only in memory. The
# MAC is a hand-rolled secret-prefix construction: sha256(secret || data).
SECRET = secrets.token_bytes(16)

# The signed example every visitor is handed: a low-privilege profile
# string and its MAC. uid is fixed so the only field that matters is role.
SAMPLE_DATA = b"role=user&uid=42"

with open(FLAG_PATH) as f:
    FLAG = f.read().strip()


def mac(data: bytes) -> str:
    return hashlib.sha256(SECRET + data).hexdigest()


def parse_fields(raw: bytes):
    fields = {}
    for part in raw.split(b"&"):
        if b"=" not in part:
            continue
        key, _, value = part.partition(b"=")
        try:
            fields[key.decode("utf-8")] = value.decode("utf-8")
        except UnicodeDecodeError:
            continue
    return fields


@app.route("/")
def index():
    return (
        "Root Cause lab: signed-request API.\n"
        "GET /sign for a signed example profile (role=user&uid=42), then\n"
        "POST /admin with JSON {\"data_hex\": ..., \"sig\": ...}. The server\n"
        "recomputes sha256(secret || data) and serves the flag when the MAC\n"
        "verifies and the parsed fields read role=admin.\n"
    )


@app.route("/sign")
def sign():
    return jsonify(
        {
            "data": SAMPLE_DATA.decode("utf-8"),
            "data_hex": SAMPLE_DATA.hex(),
            "sig": mac(SAMPLE_DATA),
            "note": "MAC is sha256(secret || data); the secret never leaves the server.",
        }
    )


@app.route("/admin", methods=["POST"])
def admin():
    body = request.get_json(silent=True) or {}
    data_hex = body.get("data_hex", "")
    sig = body.get("sig", "")
    if not isinstance(data_hex, str) or not isinstance(sig, str):
        return jsonify({"error": "data_hex and sig are required strings"}), 400
    try:
        raw = bytes.fromhex(data_hex)
    except ValueError:
        return jsonify({"error": "data_hex must be hex"}), 400
    if not raw:
        return jsonify({"error": "empty data"}), 400
    if not hmac.compare_digest(mac(raw), sig):
        return jsonify({"error": "bad signature"}), 403
    fields = parse_fields(raw)
    if fields.get("role") != "admin":
        return jsonify({"error": "forbidden", "fields": fields}), 403
    return jsonify({"flag": FLAG})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
