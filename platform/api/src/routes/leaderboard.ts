import type { FastifyInstance } from 'fastify';
import { getPrisma } from '../lib/prisma.js';
import { computeLeaderboard } from '../lib/scores.js';

export async function leaderboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/leaderboard', async () => {
    const prisma = getPrisma();
    const ranked = await computeLeaderboard(prisma);

    return {
      leaderboard: ranked.map((entry) => ({
        rank: entry.rank,
        userId: entry.userId,
        username: entry.username,
        avatarUrl: entry.avatarUrl,
        points: entry.points,
        solves: entry.solves,
        lastSolveAt: entry.lastSolveAt ? entry.lastSolveAt.toISOString() : null,
      })),
    };
  });
}
