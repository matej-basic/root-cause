import { describe, it, expect } from 'vitest';
import {
  speedBonus,
  awardedPoints,
  MAX_BONUS_FRACTION,
  BONUS_WINDOW_MS,
} from '../src/lib/scoring.js';

describe('speed-bonus scoring', () => {
  it('gives the full bonus for an instant solve', () => {
    expect(speedBonus(200, 0)).toBe(Math.round(200 * MAX_BONUS_FRACTION));
    expect(awardedPoints(200, 0)).toBe(200 + Math.round(200 * MAX_BONUS_FRACTION));
  });

  it('treats negative elapsed as zero (full bonus)', () => {
    expect(speedBonus(200, -5000)).toBe(speedBonus(200, 0));
  });

  it('decays to zero at and past the window', () => {
    expect(speedBonus(200, BONUS_WINDOW_MS)).toBe(0);
    expect(speedBonus(200, BONUS_WINDOW_MS * 2)).toBe(0);
    expect(awardedPoints(200, BONUS_WINDOW_MS)).toBe(200);
  });

  it('decays linearly to half the max bonus at the halfway point', () => {
    expect(speedBonus(200, BONUS_WINDOW_MS / 2)).toBe(Math.round(200 * MAX_BONUS_FRACTION * 0.5));
  });

  it('never awards less than the base points', () => {
    for (const ms of [0, 60_000, BONUS_WINDOW_MS / 3, BONUS_WINDOW_MS, BONUS_WINDOW_MS * 5]) {
      expect(awardedPoints(300, ms)).toBeGreaterThanOrEqual(300);
    }
  });
});
