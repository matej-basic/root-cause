import json
import os

from flask import Flask, jsonify, request
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)

# Fixed key generated once at boot and held only in memory: fine for a
# single-process lab, not a production pattern. AES-128-CBC, 16-byte
# blocks, a fresh random IV per encryption, PKCS7 padding.
KEY = get_random_bytes(16)


def build_admin_blob() -> bytes:
    with open(FLAG_PATH) as f:
        flag = f.read().strip()
    plaintext = json.dumps({"user": "admin", "flag": flag}).encode("utf-8")
    iv = get_random_bytes(AES.block_size)
    cipher = AES.new(KEY, AES.MODE_CBC, iv)
    return iv + cipher.encrypt(pad(plaintext, AES.block_size))


# The admin token is minted once at boot from the per-run flag and then
# only ever shown to visitors as ciphertext.
ADMIN_BLOB = build_admin_blob()


def parse_token(plaintext: bytes):
    try:
        doc = json.loads(plaintext.decode("utf-8"))
    except (UnicodeDecodeError, ValueError):
        return None
    if not isinstance(doc, dict) or not isinstance(doc.get("user"), str):
        return None
    return doc


INDEX_PAGE = """<!doctype html>
<html>
<head><title>token vault</title></head>
<body>
<h1>Token vault</h1>
<p>This service hands out encrypted session tokens. The administrator's
token is shown below, encrypted with AES-128-CBC (random IV prepended,
PKCS7 padding). The key never leaves the server.</p>
<p>Admin token (hex):</p>
<pre id="admin-token">{blob}</pre>
<p>Curious what a token says? POST it back as JSON to
<code>/decrypt</code>: <code>{{"blob": "&lt;hex&gt;"}}</code>. The vault
will tell you whether it accepted it.</p>
</body>
</html>
"""


@app.route("/")
def index():
    return INDEX_PAGE.format(blob=ADMIN_BLOB.hex())


@app.route("/decrypt", methods=["POST"])
def decrypt():
    data = request.get_json(silent=True) or {}
    blob_hex = data.get("blob", "")
    if not isinstance(blob_hex, str):
        return jsonify({"error": "blob must be a hex string"}), 400
    try:
        raw = bytes.fromhex(blob_hex)
    except ValueError:
        return jsonify({"error": "blob must be hex"}), 400
    if len(raw) < 2 * AES.block_size or len(raw) % AES.block_size != 0:
        return jsonify({"error": "blob must be an IV plus whole blocks"}), 400

    iv, body = raw[: AES.block_size], raw[AES.block_size :]
    cipher = AES.new(KEY, AES.MODE_CBC, iv)
    try:
        plaintext = unpad(cipher.decrypt(body), AES.block_size)
    except ValueError:
        # Distinct error for bad padding: the classic oracle.
        return jsonify({"error": "bad padding"}), 400

    doc = parse_token(plaintext)
    if doc is None:
        return jsonify({"error": "malformed token"}), 422
    return jsonify({"status": "ok", "user": doc["user"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
