const fs = require("fs");

const express = require("express");
const jwt = require("jsonwebtoken");

// The per-run flag is never read by this app directly: the flagger sidecar
// writes it to /flag/flag.txt on a shared volume, and the /admin route below
// reads it only once it decides the caller's token is an admin's.
const FLAG_PATH = process.env.FLAG_PATH || "/flag/flag.txt";

// Fixed secret: fine for a single-process lab, not a production pattern.
const SECRET_KEY = "root-cause-jwt-alg-none";

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

  // Vulnerable: verify() is called with no "algorithms" allow-list, so it
  // trusts whatever "alg" the token header itself claims. A token whose
  // header says {"alg": "none"} is accepted with no signature check at
  // all, instead of being rejected because it isn't the HS256 the server
  // actually issues.
  jwt.verify(token, SECRET_KEY, function (err, claims) {
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
