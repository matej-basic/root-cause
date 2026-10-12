import base64
import os
import pickle

from flask import Flask, make_response, request

app = Flask(__name__)

DEFAULT_PREFS = {"theme": "light", "layout": "compact"}


def page(title, body):
    return (
        "<!doctype html><html><head>"
        f"<title>{title}</title>"
        "<style>body{font-family:sans-serif;max-width:36em;margin:3em auto}</style>"
        "</head><body>"
        f"<h1>{title}</h1>{body}</body></html>"
    )


@app.route("/")
def index():
    cookie = request.cookies.get("prefs")
    if cookie:
        # Preferences arrive as a base64-encoded pickled dict and are loaded
        # straight back. pickle.loads on attacker-controlled bytes runs
        # whatever the serialized object says to run; a signed cookie or a
        # JSON blob would close this.
        try:
            prefs = pickle.loads(base64.b64decode(cookie))
        except Exception:
            prefs = DEFAULT_PREFS
    else:
        prefs = DEFAULT_PREFS

    theme = prefs.get("theme", "?") if isinstance(prefs, dict) else str(prefs)
    layout = prefs.get("layout", "?") if isinstance(prefs, dict) else ""
    resp = make_response(
        page(
            "Portal preferences",
            f"<p>Your current preferences:</p>"
            f"<ul><li>theme: <code>{theme}</code></li>"
            f"<li>layout: <code>{layout}</code></li></ul>"
            "<p>Preferences travel in your <code>prefs</code> cookie and are "
            "restored on every visit.</p>",
        )
    )
    if not cookie:
        blob = base64.b64encode(pickle.dumps(DEFAULT_PREFS)).decode()
        resp.set_cookie("prefs", blob)
    return resp


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=True)
