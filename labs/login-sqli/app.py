import os
import sqlite3

from flask import Flask, render_template_string, request

# The seeded sqlite file. seed_db.py (run by the entrypoint before this app
# starts) creates it and loads the demo user plus the secrets row.
DB_PATH = os.environ.get("DB_PATH", "/app/data.db")

app = Flask(__name__)

LOGIN_PAGE = """
<!doctype html>
<title>Harbor Logistics - Staff Portal</title>
<h1>Harbor Logistics staff portal</h1>
<p>Sign in with your staff credentials.</p>
{% if error %}<p style="color:#b00">{{ error }}</p>{% endif %}
<form method="post" action="/login">
  <p><label>Username <input name="user" autocomplete="off"></label></p>
  <p><label>Password <input name="pass" type="password"></label></p>
  <button type="submit">Sign in</button>
</form>
"""

DASHBOARD_PAGE = """
<!doctype html>
<title>Harbor Logistics - Dashboard</title>
<h1>Staff dashboard</h1>
<p>Matched account record(s) for this session:</p>
<table border="1" cellpadding="6" cellspacing="0">
  <tr><th>ID</th><th>Username</th><th>Role</th></tr>
  {% for row in rows %}
  <tr><td>{{ row[0] }}</td><td>{{ row[1] }}</td><td>{{ row[3] }}</td></tr>
  {% endfor %}
</table>
<p><a href="/login">Log out</a></p>
"""


def get_db():
    return sqlite3.connect(DB_PATH)


@app.route("/")
def index():
    return render_template_string(LOGIN_PAGE, error=None)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template_string(LOGIN_PAGE, error=None)

    user = request.form.get("user", "")
    pw = request.form.get("pass", "")

    # Vulnerable: the query is built by string formatting, not bound
    # parameters, so both fields are part of the SQL text the server runs.
    query = "SELECT * FROM users WHERE user='%s' AND pass='%s'" % (user, pw)

    conn = get_db()
    try:
        rows = conn.execute(query).fetchall()
    except sqlite3.Error as exc:
        return render_template_string(LOGIN_PAGE, error="Login error: %s" % exc)
    finally:
        conn.close()

    if rows:
        return render_template_string(DASHBOARD_PAGE, rows=rows)
    return render_template_string(LOGIN_PAGE, error="Invalid username or password.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
