import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Challenge } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getPrisma } from '../lib/prisma.js';
import { checkFlag, checkFlagAgainst } from '../lib/flag-hash.js';
import { issueRun, userFlagHashesFor } from '../lib/runs.js';
import { hashApiKey } from '../lib/api-key.js';
import { verifyAppToken } from '../lib/jwt.js';
import { optionalAuth, requireAuth } from '../lib/auth-hooks.js';

const submitSchema = z.object({
  flag: z.string().min(1).max(512),
});

/** Max runs a single user may mint per rolling 24h window. */
const RUN_DAILY_CAP = 100;

/** Public, list-safe projection of a challenge (no flagHash, no description). */
function toListItem(challenge: Challenge, solveCount: number, solved: boolean) {
  return {
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    cveId: challenge.cveId,
    category: challenge.category,
    difficulty: challenge.difficulty,
    points: challenge.points,
    summary: challenge.summary,
    image: challenge.image,
    dynamic: challenge.dynamic,
    order: challenge.order,
    active: challenge.active,
    solveCount,
    solved,
  };
}

/**
 * Rate-limit key for the submit route. Keys per authenticated user so one
 * user's attempts cannot exhaust another's budget. Falls back to IP for
 * requests without a valid token (those get 401 from the auth preHandler).
 */
function submitRateLimitKey(request: FastifyRequest): string {
  const header = request.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const user = verifyAppToken(header.slice('Bearer '.length).trim());
      return `submit:user:${user.id}`;
    } catch {
      // fall through to IP
    }
  }
  return `submit:ip:${request.ip}`;
}

/**
 * Rate-limit key for the run route. Keys per presented API key. One active key
 * per user, so this is per-user in practice, and it needs no DB lookup (mirrors
 * `submitRateLimitKey`). Falls back to IP when no bearer key is presented.
 */
function runRateLimitKey(request: FastifyRequest): string {
  const header = request.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const raw = header.slice('Bearer '.length).trim();
    if (raw) {
      return `run:key:${hashApiKey(raw)}`;
    }
  }
  return `run:ip:${request.ip}`;
}

export async function challengeRoutes(app: FastifyInstance): Promise<void> {
  // GET /challenges (auth optional)
  app.get('/challenges', { preHandler: optionalAuth }, async (request) => {
    const prisma = getPrisma();

    const challenges = await prisma.challenge.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    const counts = await prisma.solve.groupBy({
      by: ['challengeId'],
      _count: { _all: true },
    });
    const countByChallenge = new Map(counts.map((c) => [c.challengeId, c._count._all]));

    let solvedIds = new Set<string>();
    if (request.user) {
      const mine = await prisma.solve.findMany({
        where: { userId: request.user.id },
        select: { challengeId: true },
      });
      solvedIds = new Set(mine.map((s) => s.challengeId));
    }

    return {
      challenges: challenges.map((c) =>
        toListItem(c, countByChallenge.get(c.id) ?? 0, request.user ? solvedIds.has(c.id) : false),
      ),
    };
  });

  // GET /challenges/:slug (auth optional)
  app.get('/challenges/:slug', { preHandler: optionalAuth }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const prisma = getPrisma();

    const challenge = await prisma.challenge.findUnique({ where: { slug } });
    if (!challenge || !challenge.active) {
      return reply.code(404).send({ error: 'not_found' });
    }

    const solveCount = await prisma.solve.count({ where: { challengeId: challenge.id } });

    let solved = false;
    if (request.user) {
      const existing = await prisma.solve.findUnique({
        where: { userId_challengeId: { userId: request.user.id, challengeId: challenge.id } },
      });
      solved = existing !== null;
    }

    return {
      challenge: {
        ...toListItem(challenge, solveCount, solved),
        description: challenge.description,
      },
      solved,
    };
  });

  // POST /challenges/:slug/run (API-key auth)
  // The flagger sidecar presents the user's API key and gets a fresh per-run
  // flag plus a Run bound to that user.
  app.post(
    '/challenges/:slug/run',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
          keyGenerator: runRateLimitKey,
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const prisma = getPrisma();

      // API-key auth: hash the presented key and resolve a non-revoked key.
      const header = request.headers.authorization;
      const raw = header && header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
      if (!raw) {
        return reply.code(401).send({ error: 'unauthorized' });
      }
      const apiKey = await prisma.apiKey.findFirst({
        where: { hashedKey: hashApiKey(raw), revoked: false },
      });
      if (!apiKey) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const challenge = await prisma.challenge.findUnique({ where: { slug } });
      if (!challenge || !challenge.active || !challenge.dynamic) {
        return reply.code(404).send({ error: 'not_found' });
      }

      // Daily cap: count this user's runs in the last 24h.
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = await prisma.run.count({
        where: { userId: apiKey.userId, createdAt: { gte: since } },
      });
      if (recent >= RUN_DAILY_CAP) {
        return reply.code(429).send({ error: 'rate_limited' });
      }

      const { run, flag } = await issueRun(prisma, {
        userId: apiKey.userId,
        challengeId: challenge.id,
      });

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      return { runId: run.id, flag };
    },
  );

  // POST /challenges/:slug/submit (web JWT auth)
  app.post(
    '/challenges/:slug/submit',
    {
      preHandler: requireAuth,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
          keyGenerator: submitRateLimitKey,
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };

      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body' });
      }

      const prisma = getPrisma();
      const challenge = await prisma.challenge.findUnique({ where: { slug } });
      if (!challenge || !challenge.active) {
        return reply.code(404).send({ error: 'not_found' });
      }

      const userId = request.user!.id;

      // Dynamic challenges validate against the per-run flags issued to this
      // user; static ones against the single baked-in flag hash.
      let correct: boolean;
      if (challenge.dynamic) {
        const hashes = await userFlagHashesFor(prisma, userId, challenge.id);
        if (hashes.length === 0) {
          return reply.code(422).send({ error: 'no_run' });
        }
        correct = checkFlagAgainst(parsed.data.flag, hashes);
      } else {
        if (!challenge.flagHash) {
          return reply.code(422).send({ error: 'submissions_disabled' });
        }
        correct = checkFlag(parsed.data.flag, challenge.flagHash);
      }

      // Record every attempt (never the raw flag).
      await prisma.submission.create({
        data: { userId, challengeId: challenge.id, correct },
      });

      if (!correct) {
        return { correct: false };
      }

      const already = await prisma.solve.findUnique({
        where: { userId_challengeId: { userId, challengeId: challenge.id } },
      });
      if (already) {
        return { correct: true, alreadySolved: true, pointsAwarded: 0 };
      }

      try {
        await prisma.solve.create({ data: { userId, challengeId: challenge.id } });
        return { correct: true, alreadySolved: false, pointsAwarded: challenge.points };
      } catch (err) {
        // Lost the race to another concurrent correct submission.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          return { correct: true, alreadySolved: true, pointsAwarded: 0 };
        }
        throw err;
      }
    },
  );
}
