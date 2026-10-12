import re

from flask import Flask, render_template_string, request
import requests

app = Flask(__name__)

PAGE = """
<!doctype html>
<title>Root Cause lab: link preview</title>
<h1>Link preview</h1>
<p>Paste a URL and this tool fetches it server-side to show you a preview,
the way a chat app or a note-taking tool previews a link you pasted.</p>
<form method="post">
  <input name="url" placeholder="https://example.com" style="width:420px">
  <button type="submit">Preview</button>
</form>
{% if error %}<p style="color:#b00">{{ error }}</p>{% endif %}
{% if preview %}
<hr>
<h2>{{ preview.title }}</h2>
<pre>{{ preview.body }}</pre>
{% endif %}
"""


def fetch_preview(url):
    # The lab's vulnerable step: the server fetches whatever URL the caller
    # gives it, with no allowlist of schemes or hosts, no block on loopback
    # or private address ranges, and redirects followed by default.
    resp = requests.get(url, timeout=5, allow_redirects=True)
    title_match = re.search(r"<title>(.*?)</title>", resp.text, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else url
    return {"title": title, "body": resp.text[:2000]}


@app.route("/", methods=["GET", "POST"])
def index():
    preview = None
    error = None
    if request.method == "POST":
        url = request.form.get("url", "").strip()
        if not url:
            error = "Paste a URL first."
        else:
            try:
                preview = fetch_preview(url)
            except Exception as exc:
                error = f"Could not fetch that URL: {exc}"
    return render_template_string(PAGE, preview=preview, error=error)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
