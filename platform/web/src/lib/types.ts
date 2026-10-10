// Shared types mirroring platform/API_CONTRACT.md.

export type Category = "web" | "pwn" | "crypto" | "misc";
export type Difficulty = "easy" | "medium" | "hard";

// A challenge as returned by GET /challenges (list shape, no description).
export interface ChallengeListItem {
  id: string;
  slug: string;
  title: string;
  cveId: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  summary: string;
  order: number;
  active: boolean;
  solveCount: number;
  solved: boolean;
}

// GET /challenges/:slug adds the markdown description.
export interface ChallengeDetail extends ChallengeListItem {
  description: string;
}

export interface User {
  id: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface UserStats {
  points: number;
  solves: number;
  rank: number | null;
}

export interface SolveInfo {
  challengeId: string;
  solvedAt: string; // ISO timestamp
}

// GET /me
export interface MeResponse {
  user: User;
  stats: UserStats;
  solvedChallengeIds: string[];
  solves?: SolveInfo[];
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  points: number;
  solves: number;
  lastSolveAt: string | null;
}

// POST /challenges/:slug/submit result, normalized for the UI.
export type SubmitOutcome =
  | "correct"
  | "already_solved"
  | "wrong"
  | "submissions_disabled"
  | "rate_limited"
  | "unauthenticated"
  | "error";

export interface SubmitResult {
  outcome: SubmitOutcome;
  pointsAwarded?: number;
  message?: string;
}
