import Link from "next/link";
import type { ChallengeListItem } from "@/lib/types";
import { CategoryBadge, CveBadge, DifficultyBadge, PointsBadge, SolvedPill } from "./Badges";

export function ChallengeCard({
  challenge,
  solved = false,
}: {
  challenge: ChallengeListItem;
  solved?: boolean;
}) {
  const isSolved = solved || challenge.solved;
  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-all duration-150 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] focus-visible:-translate-y-1"
    >
      <div className="flex items-center justify-between gap-3">
        <CveBadge cveId={challenge.cveId} />
        <PointsBadge points={challenge.points} />
      </div>

      <h3 className="mt-3 text-[17px] font-semibold leading-snug text-fg group-hover:text-accent-strong">
        {challenge.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {challenge.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CategoryBadge category={challenge.category} />
        <DifficultyBadge difficulty={challenge.difficulty} />
        {isSolved && <SolvedPill />}
      </div>
    </Link>
  );
}
