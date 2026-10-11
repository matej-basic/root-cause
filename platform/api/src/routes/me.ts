import type { FastifyInstance } from 'fastify';
import { getPrisma } from '../lib/prisma.js';
import { computeLeaderboard } from '../lib/scores.js';
import { requireAuth } from '../lib/auth-hooks.js';
import { generateApiKey } from '../lib/api-key.js';

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: requireAuth }, async (request) => {
    const user = request.user!;
    const prisma = getPrisma();

    const ranked = await computeLeaderboard(prisma);
    const mine = ranked.find((entry) => entry.userId === user.id);

    const solves = await prisma.solve.findMany({
      where: { userId: user.id },
      select: { challengeId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Surface whether the user has an active API key (and its display prefix),
    // never the secret itself.
    const apiKey = await prisma.apiKey.findFirst({
      where: { userId: user.id, revoked: false },
      select: { prefix: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      stats: {
        points: mine?.points ?? 0,
        solves: mine?.solves ?? 0,
        rank: mine?.rank ?? null,
      },
      apiKey: apiKey ? { exists: true, prefix: apiKey.prefix } : { exists: false },
      solvedChallengeIds: solves.map((s) => s.challengeId),
      solves: solves.map((s) => ({
        challengeId: s.challengeId,
        solvedAt: s.createdAt.toISOString(),
      })),
    };
  });

  // POST /me/api-key (auth): mint a fresh API key, returning the plaintext ONCE.
  // Any existing key for the user is revoked, so there is one active key.
  app.post('/me/api-key', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user!;
    const prisma = getPrisma();

    const { key, hashedKey, prefix } = generateApiKey();

    await prisma.$transaction([
      prisma.apiKey.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      }),
      prisma.apiKey.create({
        data: { userId: user.id, hashedKey, prefix },
      }),
    ]);

    return reply.code(201).send({ key });
  });
}
