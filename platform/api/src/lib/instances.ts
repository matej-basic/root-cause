import type { Instance, PrismaClient } from '@prisma/client';
import { generateDynamicFlag } from './flag-hash.js';

/**
 * Instance lifecycle for hosted, per-user challenge deployments.
 *
 * This module owns the database side of an instance: minting its dynamic flag,
 * enforcing the one-at-a-time cap, the TTL, and the flag hashes that `submit`
 * validates against. It does NOT spawn or tear down containers; that is the
 * orchestrator's job (v2, the single-VM + reaper step). The orchestrator calls
 * `issueInstance` to reserve a row and get the raw flag to inject, then
 * `markInstanceRunning` once the container answers, and the reaper calls
 * `expireOverdueInstances` to find rows whose containers it must kill.
 */

/** Default lifetime of an instance before the reaper expires it. */
export const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
/** One extend step. */
export const EXTEND_STEP_MS = 60 * 60 * 1000; // +1 hour
/** Hard ceiling on total lifetime (createdAt + cap), regardless of extends. */
export const MAX_LIFETIME_MS = 6 * 60 * 60 * 1000; // 6 hours

/** The caller already has a live instance for this challenge (concurrency cap). */
export class InstanceExistsError extends Error {
  constructor(public readonly instance: Instance) {
    super('instance_exists');
    this.name = 'InstanceExistsError';
  }
}

/** The user's current provisioning/running instance for a challenge, or null. */
export function activeInstanceFor(
  prisma: PrismaClient,
  userId: string,
  challengeId: string,
): Promise<Instance | null> {
  return prisma.instance.findFirst({
    where: { userId, challengeId, status: { in: ['provisioning', 'running'] } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Every flag hash ever issued to this user for this challenge. Retained after
 * teardown, so a solve submitted just before expiry still validates. This is
 * what `submit` checks a dynamic flag against.
 */
export async function userFlagHashesFor(
  prisma: PrismaClient,
  userId: string,
  challengeId: string,
): Promise<string[]> {
  const rows = await prisma.instance.findMany({
    where: { userId, challengeId },
    select: { flagHash: true },
  });
  return rows.map((r) => r.flagHash);
}

/**
 * Reserve a new instance in `provisioning` with a fresh flag. Returns the row
 * plus the raw flag the orchestrator must inject into the container. The raw
 * flag is never stored; only its hash lives on the row. Throws
 * `InstanceExistsError` when the user already has a live instance for the
 * challenge.
 */
export async function issueInstance(
  prisma: PrismaClient,
  args: { userId: string; challengeId: string; ttlMs?: number },
): Promise<{ instance: Instance; flag: string }> {
  const existing = await activeInstanceFor(prisma, args.userId, args.challengeId);
  if (existing) {
    throw new InstanceExistsError(existing);
  }

  const { flag, flagHash } = generateDynamicFlag();
  const expiresAt = new Date(Date.now() + (args.ttlMs ?? DEFAULT_TTL_MS));
  const instance = await prisma.instance.create({
    data: {
      userId: args.userId,
      challengeId: args.challengeId,
      status: 'provisioning',
      flagHash,
      expiresAt,
    },
  });
  return { instance, flag };
}

/** Mark a provisioned instance live and reachable. */
export function markInstanceRunning(
  prisma: PrismaClient,
  id: string,
  url: string,
): Promise<Instance> {
  return prisma.instance.update({ where: { id }, data: { status: 'running', url } });
}

/** Provisioning failed; the orchestrator could not bring the container up. */
export function markInstanceFailed(prisma: PrismaClient, id: string): Promise<Instance> {
  return prisma.instance.update({ where: { id }, data: { status: 'failed' } });
}

/** User tore the instance down before its TTL. */
export function stopInstance(prisma: PrismaClient, id: string): Promise<Instance> {
  return prisma.instance.update({ where: { id }, data: { status: 'stopped' } });
}

/** Push the TTL out by one step, capped at `createdAt + MAX_LIFETIME_MS`. */
export async function extendInstance(prisma: PrismaClient, id: string): Promise<Instance> {
  const instance = await prisma.instance.findUniqueOrThrow({ where: { id } });
  const cap = instance.createdAt.getTime() + MAX_LIFETIME_MS;
  const next = Math.min(instance.expiresAt.getTime() + EXTEND_STEP_MS, cap);
  return prisma.instance.update({ where: { id }, data: { expiresAt: new Date(next) } });
}

/**
 * Flip overdue provisioning/running instances to `expired` and return them, so
 * the reaper knows which containers to kill. Idempotent: a second run returns
 * nothing because the rows are already `expired`.
 */
export async function expireOverdueInstances(
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<Instance[]> {
  const overdue = await prisma.instance.findMany({
    where: { status: { in: ['provisioning', 'running'] }, expiresAt: { lt: now } },
  });
  if (overdue.length === 0) {
    return [];
  }
  await prisma.instance.updateMany({
    where: { id: { in: overdue.map((i) => i.id) } },
    data: { status: 'expired' },
  });
  return overdue;
}
