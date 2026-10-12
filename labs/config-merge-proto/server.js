const express = require('express');
const fs = require('fs');

const FLAG_PATH = process.env.FLAG_PATH || '/flag/flag.txt';

const app = express();
app.use(express.json());

// Server-side preferences. Nothing sensitive lives here on its own; it is
// just the kind of per-account settings object a real app would let a
// signed-in user adjust (theme, language, notification channels).
const serverConfig = {
  theme: 'light',
  language: 'en',
  notifications: { email: true, sms: false },
};

// The classic vulnerable recursive merge: it walks every own enumerable
// key the caller sends, descends into nested objects, and assigns
// whatever it finds straight onto the matching key of the target. It
// never checks the key name, so "__proto__" (and "constructor.prototype")
// are walked exactly like any other key.
function merge(target, source) {
  for (const key in source) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

app.get('/', (req, res) => {
  res.type('text/plain').send(
    'Root Cause lab: settings API.\n' +
      'GET /settings reads the current preferences, POST /settings updates\n' +
      'them with a JSON body. GET /admin is for admins only.\n'
  );
});

app.get('/settings', (req, res) => {
  res.json(serverConfig);
});

app.post('/settings', (req, res) => {
  merge(serverConfig, req.body || {});
  res.json(serverConfig);
});

app.get('/admin', (req, res) => {
  // A brand new, unrelated object, not serverConfig. In a normal run it
  // has no isAdmin property at all, so this stays closed.
  const request = {};
  if (!request.isAdmin) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const flag = fs.readFileSync(FLAG_PATH, 'utf8').trim();
  res.json({ flag });
});

const port = 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`config-merge-proto listening on ${port}`);
});
