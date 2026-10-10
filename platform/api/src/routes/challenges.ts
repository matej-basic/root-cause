import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Challenge } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getPrisma } from '../lib/prisma.js';
import { checkFlag } from '../lib/flag-hash.js';
import { verifyAppToken } from '../lib/jwt.js';
import { optionalAuth, requireAuth } from '../lib/auth-hooks.js';

const submitSchema = z.object({
  flag: z.string().min(1).max(512),
});

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

  // POST /challenges/:slug/submit (auth)
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
      if (!challenge.flagHash) {
        return reply.code(422).send({ error: 'submissions_disabled' });
      }

      const userId = request.user!.id;
      const correct = checkFlag(parsed.data.flag, challenge.flagHash);

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
