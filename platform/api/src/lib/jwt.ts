import jwt from 'jsonwebtoken';
import { requireEnv } from './env.js';

/** Shape of the signed JWT payload, per the API contract. */
export interface AppJwtPayload {
  sub: string;
  gh: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

/** The authenticated principal attached to a request. */
export interface AuthUser {
  id: string;
  githubId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

interface UserForToken {
  id: string;
  githubId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

export function signAppToken(user: UserForToken): string {
  const secret = requireEnv('JWT_SECRET');
  const payload: AppJwtPayload = {
    sub: user.id,
    gh: user.githubId,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
  const options: jwt.SignOptions = { algorithm: 'HS256', expiresIn: '7d' };
  return jwt.sign(payload, secret, options);
}

export function verifyAppToken(token: string): AuthUser {
  const secret = requireEnv('JWT_SECRET');
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
  }) as AppJwtPayload & jwt.JwtPayload;
  return {
    id: decoded.sub,
    githubId: decoded.gh,
    username: decoded.username,
    name: decoded.name ?? null,
    avatarUrl: decoded.avatarUrl ?? null,
  };
}
