import { createHash, randomBytes } from 'node:crypto';

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

/**
 * True when the submitted flag matches any of the given hashes. Dynamic
 * challenges validate against every flag ever issued to the user for that
 * challenge (one per instance), so re-deploying and solving an earlier
 * instance both count.
 */
export function checkFlagAgainst(submitted: string, flagHashes: string[]): boolean {
  const h = hashFlag(submitted);
  return flagHashes.includes(h);
}

/**
 * Mint a fresh per-instance flag. Returns the raw flag (to inject into the
 * container as its FLAG, never persisted) and its hash (stored on the
 * Instance row for later validation). 96 bits of entropy, so a flag cannot be
 * guessed or shared usefully across users.
 */
export function generateDynamicFlag(): { flag: string; flagHash: string } {
  const flag = `flag{${randomBytes(12).toString('hex')}}`;
  return { flag, flagHash: hashFlag(flag) };
}
