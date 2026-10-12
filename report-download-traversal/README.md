# report-download-traversal

## Vulnerability description

`report-download-traversal` is a hand-built lab, not a CVE. It reproduces a
path traversal bug that sits entirely in application code: a download
endpoint that takes a filename from the client, joins it onto a server-side
directory, and serves whatever the join produces.

The scenario is a client report portal for a fictional analytics firm,
Meridian. A customer downloads their own reports through one endpoint,
`/download`, which takes a `file` parameter naming the report. There is no
framework CVE here and no outdated library. The join itself does not check
that the result stays inside the reports directory, so a relative path in
`file` walks the server off its intended directory and onto whatever else
the process can read.

## Vulnerable configuration

The entire bug is in `app.py`, in how the download path is built:

```python
path = os.path.join(REPORTS_DIR, filename)
...
return send_file(path, as_attachment=True, ...)
```

`filename` comes straight from the request's `file` query parameter.
`os.path.join` does not care whether its second argument tries to leave the
first behind, and `send_file` opens whatever path it is given. Two decoy
reports ship in the drawer so a normal request has something real to
return, but nothing about the handler limits where a request can end up.

The per-run flag is never copied into the app's own files. The `flagger`
sidecar writes it straight to the shared `flag` volume, mounted into the
challenge container alongside the reports directory, and it stays there.
There is no seeding step and no database row holding a copy. Reaching that
file is only possible through the same join the download endpoint uses for
its own reports.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to the
shared `flag` volume. The `challenge` container mounts that same volume and
serves the report portal on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f report-download-traversal/compose.yml up
```

Once it is up:

```bash
curl http://localhost:8080/
curl -OJ "http://localhost:8080/download?file=q3-report.txt"
```

That call returns one of the two reports seeded in the drawer, nothing
more. `/download` is your entry point from here. The `file` parameter ends
up inside a path join with no check on where it lands, and the reports
directory is a few levels below the filesystem root. Work out how many
steps up get you clear of it, and where the `flagger` sidecar left its
file.

Tear the lab down with:

```bash
docker compose -f report-download-traversal/compose.yml down -v
```
