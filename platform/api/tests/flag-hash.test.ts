import { describe, it, expect } from 'vitest';
import { hashFlag, checkFlag } from '../src/lib/flag-hash.js';

// No real challenge flags appear here; these are arbitrary test tokens.
describe('flag hashing', () => {
  it('produces a 64-char hex digest and trims surrounding whitespace', () => {
    const h = hashFlag('sample-token');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashFlag('  sample-token  ')).toBe(h);
    expect(hashFlag('sample-token\n')).toBe(h);
  });

  it('accepts the matching flag (with surrounding whitespace)', () => {
    const h = hashFlag('the-right-answer');
    expect(checkFlag('the-right-answer', h)).toBe(true);
    expect(checkFlag('   the-right-answer\n', h)).toBe(true);
  });

  it('rejects a wrong flag', () => {
    const h = hashFlag('the-right-answer');
    expect(checkFlag('the-wrong-answer', h)).toBe(false);
    expect(checkFlag('', h)).toBe(false);
  });

  it('is case-sensitive', () => {
    const h = hashFlag('CaseSensitive');
    expect(checkFlag('casesensitive', h)).toBe(false);
    expect(checkFlag('CaseSensitive', h)).toBe(true);
  });
});
