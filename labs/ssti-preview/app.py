import os

from flask import Flask, render_template_string, request

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")

app = Flask(__name__)


def page(title, body):
    return (
        "<!doctype html><html><head>"
        f"<title>{title}</title>"
        "<style>body{font-family:sans-serif;max-width:36em;margin:3em auto}"
        "label{display:block;margin-top:1em}</style>"
        "</head><body>"
        f"<h1>{title}</h1>{body}</body></html>"
    )


def index_page():
    return page(
        "Team directory - profile preview",
        "<p>Update your directory bio and preview how it will look before "
        "it goes live.</p>"
        '<form method="post" action="/preview">'
        '<label>Bio <input name="bio" size="40" placeholder="on-call engineer, coffee-driven"></label>'
        '<p><button type="submit">Preview</button></p>'
        "</form>",
    )


@app.route("/")
def index():
    return index_page()


@app.route("/preview", methods=["POST"])
def preview():
    bio = request.form.get("bio", "")
    # The bio is concatenated into the template source itself instead of
    # being passed as template data, so Jinja parses whatever the user
    # sends as template syntax. render_template_string("Hello " + bio)
    # is the bug; render_template_string("Hello {{ bio }}", bio=bio)
    # would be safe.
    template = (
        "<!doctype html><html><head><title>Preview</title>"
        "<style>body{font-family:sans-serif;max-width:36em;margin:3em auto}</style>"
        "</head><body>"
        "<h1>Team directory - preview</h1>"
        "<p>This is how your bio will appear:</p>"
        "<blockquote>Hello " + bio + "</blockquote>"
        '<p><a href="/">Back</a></p>'
        "</body></html>"
    )
    return render_template_string(template)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=True)
