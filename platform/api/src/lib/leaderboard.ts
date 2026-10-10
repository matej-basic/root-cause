/**
 * Pure leaderboard ranking logic. No database or framework imports, so it is
 * trivially unit-testable.
 */

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  solves: number;
  /** Max of the user's solve timestamps (the moment they reached their score). */
  lastSolveAt: Date | null;
}

export interface RankedEntry extends LeaderboardEntry {
  rank: number;
}

type Comparable = Pick<LeaderboardEntry, 'points' | 'lastSolveAt' | 'username'>;

/**
 * Ordering: points descending, then earliest `lastSolveAt` first (an earlier
 * finish wins a point tie), then username ascending. A missing `lastSolveAt`
 * sorts last among equal points.
 */
export function compareLeaderboard(a: Comparable, b: Comparable): number {
  if (a.points !== b.points) {
    return b.points - a.points;
  }

  const at = a.lastSolveAt ? a.lastSolveAt.getTime() : Number.POSITIVE_INFINITY;
  const bt = b.lastSolveAt ? b.lastSolveAt.getTime() : Number.POSITIVE_INFINITY;
  if (at !== bt) {
    return at - bt;
  }

  if (a.username < b.username) return -1;
  if (a.username > b.username) return 1;
  return 0;
}

/**
 * Filter out users with zero solves, sort by the comparator, and assign a
 * 1-based rank.
 */
export function rankLeaderboard(entries: LeaderboardEntry[]): RankedEntry[] {
  return entries
    .filter((e) => e.solves > 0)
    .sort(compareLeaderboard)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
