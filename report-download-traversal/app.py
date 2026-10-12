import os

from flask import Flask, abort, request, send_file

# Where this customer's own reports live. Nothing stops a request from
# climbing out of it; see the /download handler below.
REPORTS_DIR = os.environ.get("REPORTS_DIR", "/app/data/reports/customer")

app = Flask(__name__)


@app.get("/")
def index():
    return (
        "Root Cause lab: Meridian Analytics report portal.\n"
        "GET /download?file=<name> fetches a report from your report "
        "drawer, for example /download?file=q3-report.txt\n"
    )


@app.get("/download")
def download():
    filename = request.args.get("file")
    if not filename:
        return {"error": "file parameter required"}, 400

    # Vulnerable configuration: the client-supplied filename is joined
    # straight onto REPORTS_DIR and handed to send_file with no
    # normalization and no check that the result stays inside REPORTS_DIR.
    # A relative path in `file` walks the join straight out of the
    # drawer and anywhere else the process can read.
    path = os.path.join(REPORTS_DIR, filename)

    if not os.path.isfile(path):
        abort(404)

    return send_file(path, as_attachment=True, download_name=os.path.basename(filename))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
