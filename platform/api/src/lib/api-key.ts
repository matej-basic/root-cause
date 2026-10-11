import { createHash, randomBytes } from 'node:crypto';

/** sha256 hex of a raw API key, as stored in `ApiKey.hashedKey`. */
export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Mint a fresh API key. Returns the raw key (shown to the user once), its
 * sha256 hash (stored), and a short prefix kept for display so a user can tell
 * which key is active without revealing the secret. 32 bytes of entropy,
 * base64url so it is copy-paste safe in a shell env var.
 */
export function generateApiKey(): { key: string; hashedKey: string; prefix: string } {
  const key = `rc_${randomBytes(32).toString('base64url')}`;
  return { key, hashedKey: hashApiKey(key), prefix: key.slice(0, 11) };
}
