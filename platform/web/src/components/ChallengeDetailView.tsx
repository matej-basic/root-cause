"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChallenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ChallengeDetail } from "@/lib/types";
import { CategoryBadge, CveBadge, DifficultyBadge, PointsBadge, SolvedPill } from "./Badges";
import { Markdown } from "./Markdown";
import { FlagSubmitForm } from "./FlagSubmitForm";
import { RunChallenge } from "./RunChallenge";

// Challenge page body. The server pre-renders `initial`; the client refetches
// with the user's token so the solved state is accurate.
export function ChallengeDetailView({ initial }: { initial: ChallengeDetail }) {
  const slug = initial.slug;
  const { solvedChallengeIds } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeDetail>(initial);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getChallenge(slug);
      if (!active) return;
      // Keep the pre-rendered copy if the API is cold or returns nothing.
      if (data) setChallenge(data);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const solved = useMemo(() => {
    return challenge.solved || solvedChallengeIds.includes(challenge.id);
  }, [challenge, solvedChallengeIds]);

  const backLink = (
    <Link
      href="/challenges"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All challenges
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {backLink}

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <CveBadge cveId={challenge.cveId} linkToNvd />
          {solved && <SolvedPill />}
        </div>
        <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight">
          {challenge.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <CategoryBadge category={challenge.category} />
          <DifficultyBadge difficulty={challenge.difficulty} />
          <span className="ml-1">
            <PointsBadge points={challenge.points} />
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(300px,360px)]">
        <article className="min-w-0">
          <Markdown content={challenge.description} />
          {challenge.image && (
            <RunChallenge slug={challenge.slug} image={challenge.image} />
          )}
        </article>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <FlagSubmitForm slug={challenge.slug} initiallySolved={solved} />
        </aside>
      </div>
    </div>
  );
}
