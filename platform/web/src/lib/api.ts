// Typed API client for the platform backend (see platform/API_CONTRACT.md).
//
// Contract:
// - Base URL from NEXT_PUBLIC_API_URL.
// - Bearer JWT auth; Authorization header is attached whenever a token exists.
// - Every call is wrapped so a cold, slow, or absent API never throws into a
//   render. Reads return a safe empty/fallback value; the submit call returns a
//   normalized outcome.

import { getToken } from "./token";
import type {
  ChallengeDetail,
  ChallengeListItem,
  GenerateApiKeyResult,
  LeaderboardRow,
  MeResponse,
  SubmitResult,
} from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export function apiBaseUrl(): string {
  return API_URL;
}

export function githubSignInUrl(): string {
  return `${API_URL}/auth/github`;
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean; // attach bearer token if available
  timeoutMs?: number;
}

interface RawResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

// Low-level fetch with a timeout. Never throws; returns ok:false on any failure
// (network error, timeout, non-JSON body).
async function rawRequest<T>(path: string, opts: RequestOptions = {}): Promise<RawResponse<T>> {
  const { method = "GET", body, auth = true, timeoutMs = 8000 } = opts;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller?.signal,
    });

    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }

    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// GET /challenges → list (auth optional; token sent so `solved` is accurate).
export async function getChallenges(): Promise<ChallengeListItem[]> {
  const res = await rawRequest<{ challenges: ChallengeListItem[] }>("/challenges");
  if (res.ok && res.data?.challenges) return res.data.challenges;
  return [];
}

// GET /challenges/:slug → detail with markdown description, or null.
export async function getChallenge(slug: string): Promise<ChallengeDetail | null> {
  const res = await rawRequest<{ challenge: ChallengeDetail; solved: boolean }>(
    `/challenges/${encodeURIComponent(slug)}`,
  );
  if (res.ok && res.data?.challenge) {
    // Contract returns `solved` as a sibling of `challenge`; fold it in.
    return { ...res.data.challenge, solved: res.data.solved ?? res.data.challenge.solved ?? false };
  }
  return null;
}

// POST /challenges/:slug/submit → normalized outcome for the UI.
export async function submitFlag(slug: string, flag: string): Promise<SubmitResult> {
  if (!getToken()) return { outcome: "unauthenticated" };

  const res = await rawRequest<{
    correct?: boolean;
    alreadySolved?: boolean;
    pointsAwarded?: number;
    error?: string;
  }>(`/challenges/${encodeURIComponent(slug)}/submit`, {
    method: "POST",
    body: { flag },
  });

  if (res.status === 401) return { outcome: "unauthenticated" };
  if (res.status === 422) return { outcome: "submissions_disabled" };
  if (res.status === 429) return { outcome: "rate_limited" };

  if (res.ok && res.data) {
    if (res.data.correct && res.data.alreadySolved) {
      return { outcome: "already_solved", pointsAwarded: res.data.pointsAwarded ?? 0 };
    }
    if (res.data.correct) {
      return { outcome: "correct", pointsAwarded: res.data.pointsAwarded ?? 0 };
    }
    return { outcome: "wrong" };
  }

  return { outcome: "error", message: res.data?.error };
}

// GET /leaderboard → ranked rows (public). Empty array on any failure.
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const res = await rawRequest<{ leaderboard: LeaderboardRow[] }>("/leaderboard", { auth: false });
  if (res.ok && res.data?.leaderboard) return res.data.leaderboard;
  return [];
}

// GET /me → user + stats + solved ids, or null when unauthenticated / down.
export async function getMe(): Promise<MeResponse | null> {
  if (!getToken()) return null;
  const res = await rawRequest<MeResponse>("/me");
  if (res.ok && res.data?.user) return res.data;
  return null;
}

// POST /me/api-key → the PLAINTEXT key, returned exactly once. The server stores
// only its hash + a short prefix; a later GET /me reports { exists, prefix }.
export async function generateApiKey(): Promise<GenerateApiKeyResult> {
  if (!getToken()) return { ok: false, reason: "unauthenticated" };
  const res = await rawRequest<{ key?: string; error?: string }>("/me/api-key", {
    method: "POST",
    body: {},
  });
  if (res.status === 401) return { ok: false, reason: "unauthenticated" };
  if (res.ok && res.data?.key) return { ok: true, key: res.data.key };
  return { ok: false, reason: "error" };
}
