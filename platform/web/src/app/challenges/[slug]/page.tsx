"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getChallenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FALLBACK_CHALLENGE_BY_SLUG } from "@/lib/challenges-fallback";
import type { ChallengeDetail } from "@/lib/types";
import { CategoryBadge, CveBadge, DifficultyBadge, PointsBadge, SolvedPill } from "@/components/Badges";
import { Markdown } from "@/components/Markdown";
import { FlagSubmitForm } from "@/components/FlagSubmitForm";
import { RunChallenge } from "@/components/RunChallenge";

export default function ChallengeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0]! : params.slug;
  const { solvedChallengeIds } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeDetail | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getChallenge(slug);
      if (!active) return;
      // Fall back to the built-in copy if the API is cold or returns nothing.
      setChallenge(data ?? FALLBACK_CHALLENGE_BY_SLUG[slug] ?? null);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const solved = useMemo(() => {
    if (!challenge) return false;
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

  // Loading
  if (challenge === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        {backLink}
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  // Not found
  if (challenge === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Challenge not found</h1>
        <p className="mt-2 text-muted">
          No challenge matches <span className="font-mono text-fg">{slug}</span>.
        </p>
        <div className="mt-6 flex justify-center">{backLink}</div>
      </div>
    );
  }

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
