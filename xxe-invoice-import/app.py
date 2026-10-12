import threading

from flask import Flask, jsonify, request
from lxml import etree

app = Flask(__name__)

# In-memory store of invoices imported in this run.
_lock = threading.Lock()
_imports = []

# Vulnerable configuration: external entities and DTD loading are both on,
# so a <!DOCTYPE> in an uploaded document can declare an entity whose
# content is pulled in from outside the document and substituted wherever
# the entity is referenced, before this app ever sees the parsed fields.
_PARSER = etree.XMLParser(
    resolve_entities=True,
    no_network=False,
    load_dtd=True,
)


@app.get("/")
def index():
    return (
        "Root Cause lab: accounting invoice importer.\n"
        "POST /import with a multipart file field named 'file' holding "
        "invoice XML (<invoice><reference/><customer/><amount/></invoice>).\n"
        "GET /invoices lists everything imported so far in this run.\n"
    )


@app.post("/import")
def import_invoice():
    uploaded = request.files.get("file")
    if uploaded is None:
        return jsonify({"error": "missing 'file' upload"}), 400

    raw = uploaded.read()
    try:
        root = etree.fromstring(raw, parser=_PARSER)
    except etree.XMLSyntaxError as exc:
        return jsonify({"error": f"invalid XML: {exc}"}), 400

    def text(tag):
        node = root.find(tag)
        return node.text if node is not None and node.text is not None else ""

    summary = {
        "reference": text("reference"),
        "customer": text("customer"),
        "amount": text("amount"),
    }

    with _lock:
        _imports.append(summary)

    return jsonify({"status": "imported", "summary": summary})


@app.get("/invoices")
def list_invoices():
    with _lock:
        return jsonify(list(_imports))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
