import { CATEGORY_BADGE, DIFFICULTY_BADGE, categoryLabel, nvdUrl } from "@/lib/format";
import type { Category, Difficulty } from "@/lib/types";
import { ExternalLink } from "lucide-react";

const PILL = "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold";

export function CategoryBadge({ category }: { category: Category | string }) {
  const cls = CATEGORY_BADGE[category] ?? "text-muted bg-surface-2";
  return <span className={`${PILL} ${cls}`}>{categoryLabel(category)}</span>;
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty | string }) {
  const cls = DIFFICULTY_BADGE[difficulty] ?? "text-muted bg-surface-2";
  return <span className={`${PILL} ${cls}`}>{difficulty}</span>;
}

export function PointsBadge({ points }: { points: number }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-display text-xl font-bold text-accent-strong">{points}</span>
      <span className="text-[11px] text-faint">pts</span>
    </span>
  );
}

// Monospace CVE identifier; when linkToNvd is set it opens the NVD detail page.
export function CveBadge({ cveId, linkToNvd = false }: { cveId: string; linkToNvd?: boolean }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-faint";
  if (!linkToNvd) return <span className={base}>{cveId}</span>;
  return (
    <a
      href={nvdUrl(cveId)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} transition-colors hover:text-accent-strong`}
    >
      {cveId}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

export function SolvedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      Solved
    </span>
  );
}
