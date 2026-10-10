import { PrismaClient } from '@prisma/client';

/**
 * Lazily constructed Prisma client singleton.
 *
 * The client is only created on first `getPrisma()` call, which happens inside
 * request handlers. Importing this module (and therefore `buildApp`) never
 * constructs a client or opens a database connection. Prisma connects lazily on
 * the first query.
 */
let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}
