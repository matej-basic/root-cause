import type { PrismaClient } from '@prisma/client';
import { rankLeaderboard, type LeaderboardEntry, type RankedEntry } from './leaderboard.js';

/**
 * Aggregate every solve into per-user leaderboard entries (points, solve count,
 * most recent solve timestamp) and return them ranked. Zero-solve users never
 * appear because a user with no solves contributes no rows here.
 */
export async function computeLeaderboard(prisma: PrismaClient): Promise<RankedEntry[]> {
  const solves = await prisma.solve.findMany({
    include: {
      challenge: { select: { points: true } },
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  const byUser = new Map<string, LeaderboardEntry>();
  for (const solve of solves) {
    let entry = byUser.get(solve.userId);
    if (!entry) {
      entry = {
        userId: solve.user.id,
        username: solve.user.username,
        avatarUrl: solve.user.avatarUrl,
        points: 0,
        solves: 0,
        lastSolveAt: null,
      };
      byUser.set(solve.userId, entry);
    }
    entry.points += solve.challenge.points;
    entry.solves += 1;
    if (!entry.lastSolveAt || solve.createdAt > entry.lastSolveAt) {
      entry.lastSolveAt = solve.createdAt;
    }
  }

  return rankLeaderboard([...byUser.values()]);
}
