import { buildApp } from './app.js';

const app = buildApp();
const port = Number(process.env.PORT) || 4000;

app
  .listen({ host: '0.0.0.0', port })
  .then((address) => {
    app.log.info(`Root Cause API listening on ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
