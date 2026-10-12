const fs = require("fs");

const express = require("express");
const jwt = require("jsonwebtoken");

// The per-run flag is never read by this app directly: the flagger sidecar
// writes it to /flag/flag.txt on a shared volume, and the /admin route below
// reads it only once it decides the caller's token is an admin's.
const FLAG_PATH = process.env.FLAG_PATH || "/flag/flag.txt";

// Weak secret: a single short, common word, nowhere near long or random
// enough for an HMAC signing key. Everything else about the token handling
// below is correct.
const SECRET_KEY = "sunshine";

const app = express();

app.get("/", (req, res) => {
  res.type("text/plain").send(
    "Root Cause lab: account API with JWT session tokens.\n" +
      "POST /login to get a token for the guest account, then call\n" +
      "GET /admin with it as a Bearer token.\n"
  );
});

app.post("/login", (req, res) => {
  const token = jwt.sign({ user: "guest", admin: false }, SECRET_KEY, {
    algorithm: "HS256",
  });
  res.json({ token });
});

app.get("/admin", (req, res) => {
  const auth = req.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing bearer token" });
    return;
  }
  const token = auth.slice("Bearer ".length);

  // Not alg:none: the algorithm really is pinned to HS256 here, and
  // jsonwebtoken's own check rejects any other "alg" the token header
  // might claim, plus any signature that does not match. The bug is not
  // in this verify call, it is in SECRET_KEY above: a single common word
  // is far too small a keyspace for an HMAC secret, so anyone who
  // recovers it by brute force or dictionary search can sign their own
  // valid HS256 tokens from then on.
  jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }, function (err, claims) {
    if (err) {
      res.status(401).json({ error: "invalid token: " + err.message });
      return;
    }

    if (!claims || claims.admin !== true) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const flag = fs.readFileSync(FLAG_PATH, "utf8").trim();
    res.json({ flag });
  });
});

app.listen(8080, "0.0.0.0", () => {
  console.log("listening on 8080");
});
