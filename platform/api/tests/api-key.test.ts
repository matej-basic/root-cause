import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey } from '../src/lib/api-key.js';

describe('api keys', () => {
  it('mints a prefixed key with a matching sha256 hash and short prefix', () => {
    const { key, hashedKey, prefix } = generateApiKey();
    expect(key).toMatch(/^rc_[A-Za-z0-9_-]+$/);
    expect(hashedKey).toMatch(/^[0-9a-f]{64}$/);
    expect(hashedKey).toBe(hashApiKey(key));
    expect(prefix).toBe(key.slice(0, 11));
    expect(key.startsWith(prefix)).toBe(true);
    // The prefix must never leak the whole secret.
    expect(prefix.length).toBeLessThan(key.length);
  });

  it('mints a different key (and hash) on every call', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).not.toBe(b.key);
    expect(a.hashedKey).not.toBe(b.hashedKey);
  });

  it('hashes deterministically without trimming (keys have no surrounding space)', () => {
    expect(hashApiKey('rc_abc')).toBe(hashApiKey('rc_abc'));
    expect(hashApiKey('rc_abc ')).not.toBe(hashApiKey('rc_abc'));
  });
});
