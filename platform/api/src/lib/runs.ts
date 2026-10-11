import type { Run, PrismaClient } from '@prisma/client';
import { generateDynamicFlag } from './flag-hash.js';

/**
 * Per-run flags for the self-host model.
 *
 * A user runs a dynamic challenge locally via docker-compose. The flagger
 * sidecar authenticates with an API key and calls `POST /challenges/:slug/run`,
 * which mints a fresh flag and records a `Run` bound to the user. The raw flag
 * is handed back once (to be written into the challenge container) and is never
 * stored; only its hash lives on the row. `submit` validates a submitted flag
 * against every flag this user was ever issued for the challenge.
 */

/**
 * Mint a fresh per-run flag and record a `Run`. Returns the row plus the raw
 * flag the caller must deliver to the container. The raw flag is never stored;
 * only its hash lives on the row.
 */
export async function issueRun(
  prisma: PrismaClient,
  args: { userId: string; challengeId: string },
): Promise<{ run: Run; flag: string }> {
  const { flag, flagHash } = generateDynamicFlag();
  const run = await prisma.run.create({
    data: {
      userId: args.userId,
      challengeId: args.challengeId,
      flagHash,
    },
  });
  return { run, flag };
}

/**
 * Every flag hash ever issued to this user for this challenge. This is what
 * `submit` checks a dynamic flag against, so re-running and solving an earlier
 * run both count.
 */
export async function userFlagHashesFor(
  prisma: PrismaClient,
  userId: string,
  challengeId: string,
): Promise<string[]> {
  const rows = await prisma.run.findMany({
    where: { userId, challengeId },
    select: { flagHash: true },
  });
  return rows.map((r) => r.flagHash);
}

/**
 * Timestamp of this user's earliest run of the challenge, or null if they never
 * ran it. Used to measure solve time for the speed bonus.
 */
export async function firstRunAt(
  prisma: PrismaClient,
  userId: string,
  challengeId: string,
): Promise<Date | null> {
  const run = await prisma.run.findFirst({
    where: { userId, challengeId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  return run ? run.createdAt : null;
}
