// FleetChat admin console. A JSON login API backed by MongoDB.
//
// The flag is read once at startup from FLAG_PATH (written by the Root
// Cause flagger sidecar before this container starts) and only ever handed
// back by /dashboard, and only once the logged-in session belongs to the
// admin account.

const fs = require("fs");
const express = require("express");
const session = require("express-session");
const { MongoClient } = require("mongodb");

const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";
const FLAG_PATH = process.env.FLAG_PATH || "/flag/flag.txt";

const FLAG = fs.readFileSync(FLAG_PATH, "utf8").trim();

let usersCollection;

async function connectWithRetry(maxTries = 30, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < maxTries; i++) {
    try {
      return await MongoClient.connect(MONGO_URL);
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

const app = express();
app.use(express.json());
app.use(
  session({
    secret: "fleetchat-dev-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", (req, res) => {
  res.type("text/plain").send(
    "FleetChat admin console.\n" +
      'Sign in: POST /login with a JSON body, e.g. {"user": "dispatcher", "pass": "..."}.\n' +
      "Then GET /dashboard for your session's view.\n"
  );
});

app.post("/login", async (req, res) => {
  const credentials = req.body;
  if (
    !credentials ||
    typeof credentials !== "object" ||
    typeof credentials.user !== "string"
  ) {
    return res.status(400).json({ error: "expected a JSON body with user and pass" });
  }

  // Vulnerable: the parsed JSON body is handed straight to findOne as the
  // query filter. A client that controls the body controls the shape of the
  // query, not just the values inside it.
  const account = await usersCollection.findOne(credentials);
  if (!account) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  req.session.user = { user: account.user, role: account.role };
  res.json({ ok: true, user: account.user, role: account.role });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "login required" });
  }
  if (req.session.user.role !== "admin") {
    return res.json({
      ok: true,
      user: req.session.user.user,
      role: req.session.user.role,
      message: "Nothing to see here. Admins only past this point.",
    });
  }
  res.json({ ok: true, user: req.session.user.user, role: "admin", flag: FLAG });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

connectWithRetry()
  .then((client) => {
    usersCollection = client.db("fleetchat").collection("users");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`FleetChat listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  });
