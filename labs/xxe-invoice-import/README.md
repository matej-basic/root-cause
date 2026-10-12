# xxe-invoice-import

## Vulnerability description

This lab is an XXE (XML external entity) bug, OWASP's class for XML parsers
that resolve entities and external DTDs from untrusted input. It shows up
wherever a server accepts XML from a client and hands it to a parser whose
defaults are more permissive than the app needs.

The scenario is an accounting app's "import invoices from XML" feature. An
analyst uploads an XML file, the app parses it and shows a short summary of
what it imported, including the invoice reference. Nothing about the upload
form looks dangerous. The danger is in how the parser underneath it is
configured.

## Vulnerable configuration

`app.py` parses every uploaded file with this parser:

```python
etree.XMLParser(
    resolve_entities=True,
    no_network=False,
    load_dtd=True,
)
```

That configuration tells lxml to load a document's DTD and resolve the
entities it declares, including external ones. An XML document can declare
its own entities in a `<!DOCTYPE>` block and point one at a resource outside
the document itself. Once the parser resolves that entity, its content
replaces the reference wherever the entity is used, before any application
code touches the parsed tree. The importer then reads the `<reference>`
field as a plain string and reflects it back in the import summary, with no
idea that the field no longer holds what the uploader typed.

`POST /import` is the entry point: a multipart upload with a `file` field
holding the invoice XML. `GET /invoices` lists everything imported so far in
the running container, and a normal invoice import never produces anything
that looks like a flag.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger` sidecar
fetches a per-run flag from the Root Cause API and writes it to the shared
`flag` volume, mounted into the `challenge` container at `/flag`. The app
itself never reads that file. Reaching it is the exercise.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f xxe-invoice-import/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

A plain invoice XML document imports cleanly and shows up in `/invoices`
exactly as submitted. From there, the question is what else that parser will
resolve on your behalf, and where else on the container's filesystem it can
be pointed.

Tear the lab down with:

```bash
docker compose -f xxe-invoice-import/compose.yml down -v
```
