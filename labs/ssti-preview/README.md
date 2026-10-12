# SSTI preview

Server-side template injection in a small Flask "profile preview" feature.

## Vulnerability description

The app lets a visitor type a bio and preview how it will render. The preview
is produced by concatenating the submitted text into the template source and
passing the result to Jinja:

```python
render_template_string("... <blockquote>Hello " + bio + "</blockquote> ...")
```

Anything the visitor submits is parsed as template syntax, not displayed as
data. A Jinja expression in the bio is evaluated server side, and from the
template context the object graph leads to `os.popen`, which means remote
code execution as the web process. Passing the value as template data
(`render_template_string("... {{ bio }} ...", bio=bio)`) would escape it and
close the bug.

## Vulnerable configuration

The flag is mounted at `/flag/flag.txt` and the Flask process can read it, so
code execution inside the template is enough to recover it.

## Running the lab

```bash
docker compose up
```

The app listens on http://localhost:8080.

## Exploitation walkthrough

Confirm the injection with arithmetic: submit `{{ 7*7 }}` as the bio and the
preview shows `Hello 49`. From there, climb from a context object to the OS:

```
{{ self._TemplateReference__context.cycler.__init__.__globals__.os.popen('cat /flag/flag.txt').read() }}
```

The preview renders the contents of the flag file. `solutions/ssti-preview/solve.py`
in a checkout of this repo automates the request and prints the flag.

## References

- PortSwigger Web Security Academy: server-side template injection
- https://book.hacktricks.wiki/en/pentesting-web/ssti-server-side-template-injection/jinja2-ssti.html
