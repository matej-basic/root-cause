/**
 * Environment access helpers. Values are read at call time, never at import
 * time, so importing modules (including `buildApp`) does not require any env
 * var to be set.
 */

export function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function webOrigin(): string {
  return process.env.WEB_ORIGIN ?? 'http://localhost:3000';
}
