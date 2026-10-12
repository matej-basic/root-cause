import importlib.util
import os

from flask import Flask, request

app = Flask(__name__)

UPLOAD_DIR = "/app/plugins"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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


def index_page(error=None):
    message = f"<p><strong>{error}</strong></p>" if error else ""
    plugins = sorted(os.listdir(UPLOAD_DIR))
    items = "".join(
        f'<li><a href="/preview?name={name}">{name}</a></li>' for name in plugins
    )
    return page(
        "Report studio",
        "<p>Upload a report plugin and preview its output. Plugins are "
        "Python modules with a <code>render()</code> function.</p>"
        f"{message}"
        '<form method="post" action="/upload" enctype="multipart/form-data">'
        '<label>Plugin file <input type="file" name="file"></label>'
        '<p><button type="submit">Upload</button></p>'
        "</form>"
        f"<p>Uploaded plugins:</p><ul>{items}</ul>",
    )


@app.route("/")
def index():
    return index_page()


@app.route("/upload", methods=["POST"])
def upload():
    f = request.files.get("file")
    if not f or not f.filename:
        return index_page("No file selected."), 400
    # The only check is the Content-Type header the client chose to send.
    # Nothing inspects the extension or the contents, and uploads land in a
    # directory the preview endpoint imports from.
    if not (f.content_type or "").startswith("image/"):
        return index_page("Only image plugins are accepted."), 400
    name = os.path.basename(f.filename)
    f.save(os.path.join(UPLOAD_DIR, name))
    return index_page()


@app.route("/preview")
def preview():
    name = os.path.basename(request.args.get("name", ""))
    path = os.path.join(UPLOAD_DIR, name)
    if not os.path.isfile(path):
        return index_page("No such plugin."), 404
    try:
        spec = importlib.util.spec_from_file_location("plugin", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        output = module.render()
    except Exception as exc:
        return page("Report studio - preview failed", f"<pre>{exc}</pre>"), 500
    return page(
        "Report studio - preview",
        f"<pre>{output}</pre>"
        '<p><a href="/">Back</a></p>',
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=True)
