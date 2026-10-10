"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getChallenges } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getToken } from "@/lib/token";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { ChallengeListItem } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { CategoryBadge, CveBadge } from "@/components/Badges";
import { SignInButton } from "@/components/SignInButton";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-faint">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, stats, solvedChallengeIds, solves, loading, signOut } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getChallenges();
      if (active) setChallenges(data);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const solved = useMemo(() => {
    const ids = new Set(solvedChallengeIds);
    return challenges
      .filter((c) => ids.has(c.id))
      .sort((a, b) => a.order - b.order);
  }, [challenges, solvedChallengeIds]);

  const solvedAtById = useMemo(
    () => new Map(solves.map((s) => [s.challengeId, s.solvedAt])),
    [solves],
  );

  // Loading /me
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" aria-hidden="true" />
      </div>
    );
  }

  // Signed out. If a token exists the API is likely cold; say so instead of
  // sending the user back through OAuth for no reason.
  if (!user) {
    const hasToken = getToken() != null;
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">
          {hasToken ? "Couldn't load your profile" : "Sign in to view your profile"}
        </h1>
        <p className="mt-2 text-muted">
          {hasToken
            ? "The server did not respond. Check your connection and try again."
            : "Your profile, points, and solves show up here once you sign in."}
        </p>
        <div className="mt-6 flex justify-center">
          <SignInButton variant="primary" returnTo="/profile" />
        </div>
      </div>
    );
  }

  const displayName = user.name || user.username;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={displayName} size={64} />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-muted">@{user.username}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-border-strong hover:text-danger"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="points" value={formatNumber(stats?.points ?? 0)} />
        <StatTile label="rank" value={stats?.rank ? `#${stats.rank}` : "—"} />
        <StatTile label="solves" value={String(stats?.solves ?? solved.length)} />
      </div>

      <section aria-labelledby="solved-heading" className="mt-10">
        <h2 id="solved-heading" className="font-display text-xl font-bold tracking-tight">
          Solved challenges
        </h2>

        {solved.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-muted">
            No solves yet.{" "}
            <Link href="/challenges" className="font-semibold text-accent-strong hover:underline">
              Pick a challenge
            </Link>{" "}
            to get on the board.
          </div>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
            {solved.map((c) => (
              <li key={c.id} className="border-b border-border last:border-b-0">
                <Link
                  href={`/challenges/${c.slug}`}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"
                >
                  <span className="flex-1">
                    <span className="block font-semibold text-fg">{c.title}</span>
                    {solvedAtById.get(c.id) && (
                      <span className="block text-xs text-faint">
                        solved {formatDateTime(solvedAtById.get(c.id))}
                      </span>
                    )}
                  </span>
                  <CveBadge cveId={c.cveId} />
                  <CategoryBadge category={c.category} />
                  <span className="font-display text-sm font-bold text-accent-strong">
                    {c.points} pts
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
