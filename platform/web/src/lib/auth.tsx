"use client";

// Auth context. Loads /me when a token is present and exposes the current user,
// stats, solved challenge ids, and sign-in / sign-out helpers. Reading /me never
// throws (the API client returns null on failure), so a cold backend leaves the
// app in a clean signed-out state instead of crashing.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, githubSignInUrl } from "./api";
import { clearToken, getToken, setReturnTo } from "./token";
import type { ApiKeyInfo, SolveInfo, User, UserStats } from "./types";

interface AuthState {
  user: User | null;
  stats: UserStats | null;
  solvedChallengeIds: string[];
  solves: SolveInfo[];
  apiKey: ApiKeyInfo | null;
  loading: boolean;
  isAuthed: boolean;
  signIn: (returnTo?: string) => void;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [solvedChallengeIds, setSolvedChallengeIds] = useState<string[]>([]);
  const [solves, setSolves] = useState<SolveInfo[]>([]);
  const [apiKey, setApiKey] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // getMe() already returns null when no token is stored or the API is
  // unreachable, so a single awaited call covers signed-in, signed-out, and
  // cold-backend states. Every setState runs after the await, never
  // synchronously inside the mount effect.
  const load = useCallback(async () => {
    const me = await getMe();
    setUser(me?.user ?? null);
    setStats(me?.stats ?? null);
    setSolvedChallengeIds(me?.solvedChallengeIds ?? []);
    setSolves(me?.solves ?? []);
    setApiKey(me?.apiKey ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const me = await getMe();
      if (!active) return;
      setUser(me?.user ?? null);
      setStats(me?.stats ?? null);
      setSolvedChallengeIds(me?.solvedChallengeIds ?? []);
      setSolves(me?.solves ?? []);
      setApiKey(me?.apiKey ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((returnTo?: string) => {
    if (typeof window === "undefined") return;
    const target =
      returnTo ?? `${window.location.pathname}${window.location.search}`;
    if (target && target !== "/auth/callback") setReturnTo(target);
    window.location.href = githubSignInUrl();
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setStats(null);
    setSolvedChallengeIds([]);
    setSolves([]);
    setApiKey(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      stats,
      solvedChallengeIds,
      solves,
      apiKey,
      loading,
      isAuthed: !!user,
      signIn,
      signOut,
      refresh: load,
    }),
    [user, stats, solvedChallengeIds, solves, apiKey, loading, signIn, signOut, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
