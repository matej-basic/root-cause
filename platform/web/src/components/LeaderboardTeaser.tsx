"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";
import { Avatar } from "./Avatar";
import { RankMedal } from "./RankMedal";

// Top-5 teaser. Renders nothing until we know there is data; if the board is
// empty or unreachable it stays hidden so the landing page never shows an empty
// shell.
export function LeaderboardTeaser() {
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

  if (!rows || rows.length === 0) return null;
  const top = rows.slice(0, 5);

  return (
    <section aria-labelledby="teaser-heading">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 id="teaser-heading" className="font-display text-2xl font-bold tracking-tight">
          Leaderboard
        </h2>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
        >
          Full ranking <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
        {top.map((row) => {
          const mine = user?.id === row.userId;
          return (
            <li
              key={row.userId}
              className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
                mine ? "bg-accent-soft" : ""
              }`}
            >
              <RankMedal rank={row.rank} />
              <Avatar src={row.avatarUrl} name={row.username} size={30} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
                {row.username}
                {mine && <span className="ml-2 text-xs font-medium text-accent-strong">you</span>}
              </span>
              <span className="hidden text-sm text-muted sm:inline">{row.solves} solves</span>
              <span className="font-display text-sm font-bold text-fg">
                {formatNumber(row.points)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
