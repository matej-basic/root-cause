import os
import secrets

from flask import Flask, redirect, request, session, url_for

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)
# Fixed secret: fine for a single-process lab, not a production pattern.
app.secret_key = "root-cause-weak-mfa-otp"

# One demo account; its credentials are printed on the login page, so the
# second factor is the only thing between a visitor and the notes area.
USERS = {"analyst": "password123"}

# Pending second factors, attempt id -> 4-digit code. Kept server-side so
# the code itself is never sent to the client; the flaw this lab isolates
# is the missing throttling around guessing it, not where it is stored.
PENDING = {}

# The flag is read once at container start and held in memory; the notes
# page serves it from here.
try:
    with open(FLAG_PATH) as f:
        FLAG = f.read().strip()
except OSError:
    FLAG = None


def page(title, body):
    return (
        "<!doctype html><html><head>"
        f"<title>{title}</title>"
        "<style>body{font-family:sans-serif;max-width:36em;margin:3em auto}"
        "label{display:block;margin-top:1em}</style>"
        "</head><body>"
        f"<h1>{title}</h1>{body}</body></html>"
    )


def login_page(error=None):
    message = f"<p><strong>{error}</strong></p>" if error else ""
    return page(
        "Sentinel Ops - sign in",
        "<p>Internal notes for the on-call security team. Sign in with your "
        "staff account; a one-time code from your authenticator is required "
        "as a second step.</p>"
        "<p>Demo account: <code>analyst</code> / <code>password123</code></p>"
        f"{message}"
        f'<form method="post" action="{url_for("login")}">'
        '<label>Username <input name="username"></label>'
        '<label>Password <input name="password" type="password"></label>'
        '<p><button type="submit">Sign in</button></p>'
        "</form>",
    )


def mfa_page(error=None):
    message = f"<p><strong>{error}</strong></p>" if error else ""
    return page(
        "Sentinel Ops - two-step verification",
        "<p>Enter the 4-digit code from your authenticator to finish "
        "signing in.</p>"
        f"{message}"
        f'<form method="post" action="{url_for("mfa")}">'
        '<label>Code <input name="code" autocomplete="one-time-code"></label>'
        '<p><button type="submit">Verify</button></p>'
        "</form>",
    )


@app.route("/")
def index():
    if session.get("authed"):
        return redirect(url_for("notes"))
    return login_page()


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")
    if USERS.get(username) != password:
        return login_page("Invalid username or password."), 401

    # In a real deployment this code would be pushed to the user's
    # authenticator or phone. It is drawn fresh for every login attempt
    # and stays valid until it is used once or the session expires.
    attempt_id = secrets.token_hex(16)
    PENDING[attempt_id] = f"{secrets.randbelow(10000):04d}"

    session.clear()
    session["attempt_id"] = attempt_id
    return redirect(url_for("mfa"))


@app.route("/mfa", methods=["GET", "POST"])
def mfa():
    attempt_id = session.get("attempt_id")
    if not attempt_id or attempt_id not in PENDING:
        return redirect(url_for("index"))

    if request.method == "GET":
        return mfa_page()

    # A wrong code only re-renders the form. There is no attempt counter,
    # no lockout, and no delay, and the pending code is left untouched,
    # so the same code can be guessed as many times as the client likes.
    code = request.form.get("code", "")
    if code != PENDING[attempt_id]:
        return mfa_page("Invalid code, try again."), 401

    del PENDING[attempt_id]
    session.clear()
    session["authed"] = True
    return redirect(url_for("notes"))


@app.route("/notes")
def notes():
    if not session.get("authed"):
        return redirect(url_for("index"))
    flag = FLAG if FLAG is not None else "(flag not provisioned)"
    return page(
        "Sentinel Ops - private notes",
        "<p>Notes for the on-call rotation. Handle with care.</p>"
        "<ul>"
        "<li>Firewall ticket SOC-1187 still waiting on network team.</li>"
        "<li>Rotate the VPN gateway certificate before Friday.</li>"
        f"<li>Completion token for this shift: <code>{flag}</code></li>"
        "</ul>",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=True)
