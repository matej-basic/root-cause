import { requireEnv } from './env.js';

/** The subset of the GitHub user object this app stores. */
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
}

/**
 * Exchange an OAuth `code` for a GitHub access token. Uses Node's global
 * fetch; no HTTP client dependency.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'root-cause',
    },
    body: JSON.stringify({
      client_id: requireEnv('GITHUB_CLIENT_ID'),
      client_secret: requireEnv('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: requireEnv('GITHUB_CALLBACK_URL'),
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed with status ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!data.access_token) {
    throw new Error(`GitHub token exchange returned no access_token (${data.error ?? 'unknown'})`);
  }
  return data.access_token;
}

/** Read the authenticated GitHub user with the access token. */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'root-cause',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub user lookup failed with status ${res.status}`);
  }

  return (await res.json()) as GitHubUser;
}
