// Server-side catalog reads for pages that pre-render challenge content.
//
// These run at build or revalidation time without a user token, so `solved` is
// always false here; client components refetch with the token for that. Any
// failure falls back to the built-in list so a cold API never breaks a build.

import { FALLBACK_CHALLENGES, FALLBACK_CHALLENGE_BY_SLUG } from "./challenges-fallback";
import type { ChallengeDetail, ChallengeListItem } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export const CATALOG_REVALIDATE = 600;

// status is 0 when the API could not be reached at all.
async function fetchJson<T>(path: string): Promise<{ status: number; data: T | null }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: CATALOG_REVALIDATE },
      signal: AbortSignal.timeout(8000),
    });
    const data = res.ok ? ((await res.json()) as T) : null;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

export function sortCatalog<T extends ChallengeListItem>(list: T[]): T[] {
  return [...list].sort((a, b) => a.order - b.order || a.points - b.points);
}

export async function getCatalog(): Promise<ChallengeListItem[]> {
  const { data } = await fetchJson<{ challenges?: ChallengeListItem[] }>("/challenges");
  const list = data?.challenges?.length ? data.challenges : FALLBACK_CHALLENGES;
  return sortCatalog(list);
}

export async function getCatalogChallenge(slug: string): Promise<ChallengeDetail | null> {
  const res = await fetchJson<{ challenge?: ChallengeDetail }>(
    `/challenges/${encodeURIComponent(slug)}`,
  );
  if (res.data?.challenge) return { ...res.data.challenge, solved: false };
  // A 404 means the lab is unknown or inactive; only a down API uses the copy.
  if (res.status === 404) return null;
  return FALLBACK_CHALLENGE_BY_SLUG[slug] ?? null;
}

// Plain-text summary for meta descriptions, capped near the length search
// engines display.
export function metaDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
