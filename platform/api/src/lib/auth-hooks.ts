import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAppToken, type AuthUser } from './jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null;
  }
}

function extractUser(request: FastifyRequest): AuthUser | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  try {
    return verifyAppToken(header.slice('Bearer '.length).trim());
  } catch {
    return null;
  }
}

/** preHandler for protected routes: 401 when the bearer token is absent or invalid. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = extractUser(request);
  if (!user) {
    await reply.code(401).send({ error: 'unauthorized' });
    return;
  }
  request.user = user;
}

/** preHandler for routes where auth is optional: sets the user or leaves it null. */
export async function optionalAuth(request: FastifyRequest): Promise<void> {
  request.user = extractUser(request);
}
