import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { webOrigin } from './lib/env.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { challengeRoutes } from './routes/challenges.js';
import { leaderboardRoutes } from './routes/leaderboard.js';

/**
 * Build and return the Fastify instance WITHOUT listening. Plugin and route
 * registrations are queued and resolved on `ready()`/`listen()`/`inject()`.
 *
 * This function performs no database work and reads no required env vars, so it
 * is safe to call in tests and importing it opens no DB connection.
 */
export function buildApp(): FastifyInstance {
  const isTest = process.env.NODE_ENV === 'test';

  const app = Fastify({
    logger: isTest ? false : { level: process.env.LOG_LEVEL ?? 'info' },
    trustProxy: true,
  });

  app.decorateRequest('user', null);

  const allowedOrigins = Array.from(new Set([webOrigin(), 'http://localhost:3000']));

  app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
  });

  app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ error: 'rate_limited' }),
  });

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(meRoutes);
  app.register(challengeRoutes);
  app.register(leaderboardRoutes);

  return app;
}
