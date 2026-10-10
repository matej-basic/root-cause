import { describe, it, expect } from 'vitest';
import {
  compareLeaderboard,
  rankLeaderboard,
  type LeaderboardEntry,
} from '../src/lib/leaderboard.js';

function entry(
  username: string,
  points: number,
  lastSolveAt: Date | null,
  solves = 1,
): LeaderboardEntry {
  return { userId: username, username, avatarUrl: null, points, solves, lastSolveAt };
}

describe('leaderboard ranking', () => {
  it('orders by points descending', () => {
    const ranked = rankLeaderboard([
      entry('a', 100, new Date('2024-01-02T00:00:00Z')),
      entry('b', 300, new Date('2024-01-03T00:00:00Z')),
      entry('c', 200, new Date('2024-01-01T00:00:00Z')),
    ]);
    expect(ranked.map((e) => e.username)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('breaks point ties with the earliest lastSolveAt', () => {
    const ranked = rankLeaderboard([
      entry('late', 200, new Date('2024-01-05T00:00:00Z')),
      entry('early', 200, new Date('2024-01-01T00:00:00Z')),
    ]);
    expect(ranked.map((e) => e.username)).toEqual(['early', 'late']);
  });

  it('breaks remaining ties by username ascending', () => {
    const t = new Date('2024-01-01T00:00:00Z');
    const ranked = rankLeaderboard([
      entry('zeta', 200, t),
      entry('alpha', 200, t),
      entry('mike', 200, t),
    ]);
    expect(ranked.map((e) => e.username)).toEqual(['alpha', 'mike', 'zeta']);
  });

  it('excludes users with zero solves', () => {
    const ranked = rankLeaderboard([
      entry('none', 0, null, 0),
      entry('one', 100, new Date('2024-01-01T00:00:00Z'), 1),
    ]);
    expect(ranked.map((e) => e.username)).toEqual(['one']);
    expect(ranked).toHaveLength(1);
  });

  it('comparator sorts a mixed array into the full ordering', () => {
    const list = [
      entry('d', 200, new Date('2024-01-02T00:00:00Z')),
      entry('a', 500, new Date('2024-01-09T00:00:00Z')),
      entry('c', 200, new Date('2024-01-01T00:00:00Z')),
      entry('b', 200, new Date('2024-01-02T00:00:00Z')),
    ];
    const sorted = [...list].sort(compareLeaderboard).map((e) => e.username);
    // a: top points. Then the 200-point group: c (earliest), then b and d tie
    // on time so username decides (b before d).
    expect(sorted).toEqual(['a', 'c', 'b', 'd']);
  });

  it('sorts entries without a lastSolveAt last within equal points', () => {
    expect(
      compareLeaderboard(
        { points: 100, lastSolveAt: null, username: 'x' },
        { points: 100, lastSolveAt: new Date('2024-01-01T00:00:00Z'), username: 'y' },
      ),
    ).toBeGreaterThan(0);
  });
});
