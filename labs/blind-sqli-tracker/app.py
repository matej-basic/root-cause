import os
import sqlite3

from flask import Flask, render_template_string, request

# The seeded sqlite file. seed_db.py (run by the entrypoint before this app
# starts) creates it and loads the demo tracking codes plus the secrets row.
DB_PATH = os.environ.get("DB_PATH", "/app/data.db")

app = Flask(__name__)

TRACK_PAGE = """
<!doctype html>
<title>Harbor Logistics - Package Tracking</title>
<h1>Track your package</h1>
<p>Enter the tracking code from your shipping confirmation.</p>
<form method="post" action="/track">
  <p><label>Tracking code <input name="code" autocomplete="off"></label></p>
  <button type="submit">Check status</button>
</form>
{% if result is not none %}
  {% if result %}
    <p style="color:#070">Package found. It is on its way.</p>
  {% else %}
    <p style="color:#b00">No package found with that tracking code.</p>
  {% endif %}
{% endif %}
"""


def get_db():
    return sqlite3.connect(DB_PATH)


@app.route("/")
def index():
    return render_template_string(TRACK_PAGE, result=None)


@app.route("/track", methods=["POST"])
def track():
    code = request.form.get("code", "")

    # Vulnerable: the tracking code is spliced into the query by string
    # formatting, not bound as a parameter. The response only ever says
    # whether a row matched, never what the row contains, so this is a
    # boolean-blind injection point: no data is ever echoed back.
    query = "SELECT tracking FROM packages WHERE tracking='%s'" % code

    conn = get_db()
    try:
        rows = conn.execute(query).fetchall()
        found = bool(rows)
    except sqlite3.Error:
        # Keep the oracle strictly binary: a syntax error looks exactly
        # like "not found", never a distinct error page or status code.
        found = False
    finally:
        conn.close()

    return render_template_string(TRACK_PAGE, result=found)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
