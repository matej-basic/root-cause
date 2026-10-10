import { createHash } from 'node:crypto';

/**
 * Hash a submitted flag the same way the seed hashes the canonical flag:
 * sha256 over the trimmed, case-sensitive string, hex encoded.
 */
export function hashFlag(flag: string): string {
  return createHash('sha256').update(flag.trim()).digest('hex');
}

/**
 * Constant comparison is not required here: the stored value is a hash, not a
 * secret, and the input is already hashed before comparison.
 */
export function checkFlag(submitted: string, flagHash: string): boolean {
  return hashFlag(submitted) === flagHash;
}
