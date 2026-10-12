# Command injection diagnostics

OS command injection in a small Flask "ping this host" diagnostics page.

## Vulnerability description

The app pings a host on behalf of the visitor and shows the output. The host
value is interpolated straight into a shell command line:

```python
subprocess.run("ping -c 2 " + host, shell=True, ...)
```

Anything the shell reads as syntax becomes a new command running as the web
process: `;`, `&&`, backticks, `$()`. Passing the host as an argv list with
`shell=False` would close the bug.

## Vulnerable configuration

The flag is mounted at `/flag/flag.txt` and the Flask process can read it, so
one injected `cat` is enough.

## Running the lab

```bash
docker compose up
```

The app listens on http://localhost:8080.

## Exploitation walkthrough

Submit a normal host first and watch the result page echo the command line it
ran. Then submit:

```
127.0.0.1; cat /flag/flag.txt
```

The ping output is followed by the flag file contents.
`solutions/cmdi-diagnostics/solve.py` in a checkout of this repo automates
the request and prints the flag.

## References

- OWASP: command injection
- PortSwigger Web Security Academy: OS command injection
