"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNumber, formatRelative } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { RankMedal } from "@/components/RankMedal";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getLeaderboard();
      if (active) setRows(data);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight">
          <Trophy className="h-7 w-7 text-accent-strong" aria-hidden="true" /> Leaderboard
        </h1>
        <p className="mt-2 text-muted">
          Ranked by points, then by who got there first. Only solvers appear here.
        </p>
      </header>

      {rows === null ? (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" aria-hidden="true" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-display text-lg font-semibold">No solves yet</p>
          <p className="mt-1.5 text-muted">Be the first to land a flag and claim the top spot.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left">
            <caption className="sr-only">Players ranked by points</caption>
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-faint">
                <th scope="col" className="w-14 px-4 py-3 font-medium">#</th>
                <th scope="col" className="px-2 py-3 font-medium">Player</th>
                <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                  Solves
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right font-medium md:table-cell">
                  Last solve
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const mine = user?.id === row.userId;
                return (
                  <tr
                    key={row.userId}
                    className={`border-b border-border last:border-b-0 ${
                      mine ? "bg-accent-soft" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <RankMedal rank={row.rank} />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={row.avatarUrl} name={row.username} size={32} />
                        <span className="min-w-0 truncate font-semibold text-fg">
                          {row.username}
                          {mine && (
                            <span className="ml-2 text-xs font-medium text-accent-strong">you</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-muted sm:table-cell">
                      {row.solves}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-muted md:table-cell">
                      {formatRelative(row.lastSolveAt) || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-fg">
                      {formatNumber(row.points)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
