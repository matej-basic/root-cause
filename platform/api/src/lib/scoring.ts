/**
 * Speed-bonus scoring. A solve earns the challenge's base points plus a bonus
 * that is largest for a fast solve and decays linearly to zero over a window.
 * The functions are pure (time is passed in as elapsed milliseconds), so they
 * unit-test without a clock.
 */

// Up to +50% of the base points for an instant solve.
export const MAX_BONUS_FRACTION = 0.5;
// The bonus decays to zero over two hours.
export const BONUS_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Bonus points for solving a `base`-point challenge in `elapsedMs`. Never
 * negative; zero once the window has fully elapsed.
 */
export function speedBonus(base: number, elapsedMs: number): number {
  const clamped = elapsedMs > 0 ? elapsedMs : 0;
  const remaining = Math.max(0, 1 - clamped / BONUS_WINDOW_MS);
  return Math.round(base * MAX_BONUS_FRACTION * remaining);
}

/** Total points for a solve: base plus the speed bonus. Always at least `base`. */
export function awardedPoints(base: number, elapsedMs: number): number {
  return base + speedBonus(base, elapsedMs);
}
