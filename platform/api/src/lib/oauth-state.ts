import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { requireEnv } from './env.js';

/**
 * Stateless CSRF protection for the GitHub OAuth round trip.
 *
 * The `state` value is `nonce.timestamp.signature`, where the signature is an
 * HMAC-SHA256 over `nonce.timestamp` keyed by JWT_SECRET. There is no server
 * side storage: the callback re-derives the signature and checks both that it
 * matches and that the timestamp is recent.
 */

const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function createState(): string {
  const secret = requireEnv('JWT_SECRET');
  const nonce = randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const data = `${nonce}.${timestamp}`;
  return `${data}.${sign(data, secret)}`;
}

export function verifyState(state: string | undefined | null): boolean {
  if (!state) return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, timestamp, signature] = parts;

  const secret = requireEnv('JWT_SECRET');
  const expected = sign(`${nonce}.${timestamp}`, secret);

  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return false;
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const age = Date.now() - ts;
  return age >= 0 && age <= MAX_AGE_MS;
}
