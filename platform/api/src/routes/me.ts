import type { FastifyInstance } from 'fastify';
import { getPrisma } from '../lib/prisma.js';
import { computeLeaderboard } from '../lib/scores.js';
import { requireAuth } from '../lib/auth-hooks.js';

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

    // plan and subscriptionActive live on the DB row, not in the JWT.
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, subscriptionActive: true },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: account?.plan ?? 'free',
        subscriptionActive: account?.subscriptionActive ?? false,
      },
      stats: {
        points: mine?.points ?? 0,
        solves: mine?.solves ?? 0,
        rank: mine?.rank ?? null,
      },
      solvedChallengeIds: solves.map((s) => s.challengeId),
      solves: solves.map((s) => ({
        challengeId: s.challengeId,
        solvedAt: s.createdAt.toISOString(),
      })),
    };
  });
}
