import os
import subprocess

from flask import Flask, request

app = Flask(__name__)


def page(title, body):
    return (
        "<!doctype html><html><head>"
        f"<title>{title}</title>"
        "<style>body{font-family:sans-serif;max-width:36em;margin:3em auto}"
        "label{display:block;margin-top:1em}"
        "pre{background:#f4f4f4;padding:1em;overflow:auto}</style>"
        "</head><body>"
        f"<h1>{title}</h1>{body}</body></html>"
    )


def index_page():
    return page(
        "NetOps toolbox",
        "<p>Diagnostics for the network team. Ping a host to check "
        "reachability.</p>"
        '<form method="post" action="/ping">'
        '<label>Host <input name="host" size="40" placeholder="127.0.0.1"></label>'
        '<p><button type="submit">Ping</button></p>'
        "</form>",
    )


@app.route("/")
def index():
    return index_page()


@app.route("/ping", methods=["POST"])
def ping():
    host = request.form.get("host", "")
    # The host value is interpolated into a shell command line. Anything the
    # shell treats as syntax (;, &&, backticks, $()) runs as a new command as
    # the web process. Passing the host as an argv list with shell=False
    # would close this.
    cmd = "ping -c 2 " + host
    try:
        out = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=10
        )
        result = out.stdout + out.stderr
    except subprocess.TimeoutExpired:
        result = "(ping timed out)"
    return page(
        "NetOps toolbox - result",
        f"<p>Running: <code>{cmd}</code></p>"
        f"<pre>{result}</pre>"
        '<p><a href="/">Back</a></p>',
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=True)
