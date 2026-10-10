"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getChallenges } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FALLBACK_CHALLENGES } from "@/lib/challenges-fallback";
import type { ChallengeListItem } from "@/lib/types";
import { ChallengeCard } from "./ChallengeCard";

// Live preview grid. Tries the API, falls back to the built-in six so the
// landing page always shows real challenges even when the backend is cold.
export function ChallengePreview() {
  const { solvedChallengeIds } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>(FALLBACK_CHALLENGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getChallenges();
      if (!active) return;
      if (data.length > 0) setChallenges(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const shown = [...challenges]
    .sort((a, b) => a.order - b.order || a.points - b.points)
    .slice(0, 6);
  const solvedSet = new Set(solvedChallengeIds);

  return (
    <section aria-labelledby="preview-heading">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 id="preview-heading" className="font-display text-2xl font-bold tracking-tight">
          Challenges
        </h2>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div
        aria-busy={loading}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((c) => (
          <ChallengeCard key={c.slug} challenge={c} solved={solvedSet.has(c.id)} />
        ))}
      </div>
    </section>
  );
}
