# weak-mfa-otp

## Vulnerability description

`weak-mfa-otp` is a hand-built lab, not a CVE. It isolates a bug class
that shows up whenever a team adds a second factor to a login flow but
forgets to defend the second factor itself: missing throttling and
lockout on one-time-code verification (CWE-307, improper restriction of
excessive authentication attempts).

The scenario is an internal notes app for a fictional security-operations
team, Sentinel Ops. Signing in takes two steps. Step one is the usual
username and password; a demo account, `analyst` / `password123`, is
printed right on the login page so the first step is never the exercise.
Step two asks for the 4-digit one-time code that, in a real deployment,
would be delivered to the user's authenticator or phone.

The second step is where the app gives up everything the first factor
was supposed to buy. A wrong code only re-renders the form: there is no
attempt counter, no lockout, no delay between guesses, and the pending
code stays valid until it is used once or the session expires. A 4-digit
code has exactly 10,000 possible values, so an attacker who keeps the
login session open can simply try them all; the average search is 5,000
requests, each of them cheap.

## Vulnerable configuration

The relevant behaviour, exactly as implemented in `app.py`:

- `POST /login` with valid credentials starts a login attempt, draws a
  fresh random 4-digit code with `secrets.randbelow(10000)`, stores it
  server-side keyed by an attempt id, and redirects to `/mfa`. The code
  itself is never sent to the client, so this is not an information-leak
  lab: the only way through the second step is to guess.
- `POST /mfa` compares the submitted `code` against the pending one. On
  a match it marks the session authenticated, consumes the code, and
  redirects to `/notes`. On a mismatch it answers 401 and re-renders the
  form. Nothing else happens. No counter is incremented, no attempt id
  is invalidated, no backoff is applied.
- `GET /notes` requires an authenticated session; without one it
  redirects to the login page and reveals nothing.

The per-run flag is written by the Root Cause flagger to `/flag/flag.txt`
on a shared volume. The app reads it once at container start, holds it in
memory, and shows it on the notes page.

## Running the lab

The lab runs as a two-container docker-compose stack. The `flagger`
sidecar fetches a per-run flag from the Root Cause API and writes it to
the shared `flag` volume; the `challenge` container then serves the app
on port 8080.

```bash
export ROOTCAUSE_API_KEY=your-key-here
docker compose -f weak-mfa-otp/compose.yml up
```

Once it is up, the app answers on `http://localhost:8080`:

```bash
curl http://localhost:8080/
```

From there, sign in with the demo account to reach the code prompt, and
keep the session cookie: the pending code belongs to that login attempt.
A successful guess is distinguishable from a failed one without reading
the page body, since a match redirects to `/notes` while a miss answers
401. Scripting the guesses from `0000` upward and then fetching the
notes page is the exercise.

Tear the lab down with:

```bash
docker compose -f weak-mfa-otp/compose.yml down -v
```

## Remediation notes

The fixes that close this class: count failed verifications per attempt
and invalidate the code after a small number of misses, lock or
back off accounts that burn through attempts, expire codes quickly, and
alert on the attempt pattern. A longer code raises the cost of the
search, but only throttling and lockout make the search impractical
rather than merely slower.
