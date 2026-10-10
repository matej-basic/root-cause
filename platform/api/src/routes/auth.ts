import type { FastifyInstance } from 'fastify';
import { requireEnv, webOrigin } from '../lib/env.js';
import { createState, verifyState } from '../lib/oauth-state.js';
import { exchangeCodeForToken, fetchGitHubUser } from '../lib/github.js';
import { signAppToken } from '../lib/jwt.js';
import { getPrisma } from '../lib/prisma.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Full-page redirect to GitHub's authorize screen.
  app.get('/auth/github', async (_request, reply) => {
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', requireEnv('GITHUB_CLIENT_ID'));
    authorize.searchParams.set('redirect_uri', requireEnv('GITHUB_CALLBACK_URL'));
    authorize.searchParams.set('scope', 'read:user');
    authorize.searchParams.set('state', createState());
    return reply.redirect(authorize.toString(), 302);
  });

  // GitHub redirects back here with ?code&state.
  app.get('/auth/github/callback', async (request, reply) => {
    const web = webOrigin();
    const fail = (code: string) => reply.redirect(`${web}/auth/callback#error=${code}`, 302);

    const query = request.query as { code?: string; state?: string };

    if (!query.code) {
      return fail('missing_code');
    }
    if (!verifyState(query.state)) {
      return fail('invalid_state');
    }

    try {
      const accessToken = await exchangeCodeForToken(query.code);
      const ghUser = await fetchGitHubUser(accessToken);

      const prisma = getPrisma();
      const githubId = String(ghUser.id);
      const user = await prisma.user.upsert({
        where: { githubId },
        update: {
          username: ghUser.login,
          name: ghUser.name ?? null,
          avatarUrl: ghUser.avatar_url ?? null,
        },
        create: {
          githubId,
          username: ghUser.login,
          name: ghUser.name ?? null,
          avatarUrl: ghUser.avatar_url ?? null,
        },
      });

      const token = signAppToken(user);
      return reply.redirect(`${web}/auth/callback#token=${token}`, 302);
    } catch (err) {
      request.log.error({ err }, 'github oauth callback failed');
      return fail('oauth_failed');
    }
  });
}
