import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

// buildApp() must not open a DB connection, and /health must not touch the DB.
// These tests run with no DATABASE_URL and no Postgres available.
describe('GET /health', () => {
  let app: FastifyInstance;

  // Prove buildApp needs neither a database URL nor a JWT secret.
  delete process.env.DATABASE_URL;
  delete process.env.JWT_SECRET;

  afterAll(async () => {
    if (app) await app.close();
  });

  it('returns 200 { ok: true, time } without any DB connection', async () => {
    app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { ok: boolean; time: string };
    expect(body.ok).toBe(true);
    expect(typeof body.time).toBe('string');
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });
});
