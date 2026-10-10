"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getChallenges } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FALLBACK_CHALLENGES } from "@/lib/challenges-fallback";
import type { Category, ChallengeListItem, Difficulty } from "@/lib/types";
import { ChallengeCard } from "@/components/ChallengeCard";

const CATEGORIES: (Category | "all")[] = ["all", "web", "pwn", "crypto", "misc"];
const DIFFICULTIES: (Difficulty | "all")[] = ["all", "easy", "medium", "hard"];

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-faint">{label}</span>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              active
                ? "bg-accent text-[#04120c]"
                : "border border-border bg-surface text-muted hover:border-border-strong hover:text-fg"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function ChallengesPage() {
  const { solvedChallengeIds } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>(FALLBACK_CHALLENGES);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [query, setQuery] = useState("");

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

  const solvedSet = useMemo(() => new Set(solvedChallengeIds), [solvedChallengeIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...challenges]
      .sort((a, b) => a.order - b.order || a.points - b.points)
      .filter((c) => category === "all" || c.category === category)
      .filter((c) => difficulty === "all" || c.difficulty === difficulty)
      .filter(
        (c) =>
          q === "" ||
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.cveId.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      );
  }, [challenges, category, difficulty, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Challenges</h1>
        <p className="mt-2 text-muted">
          Six labs across four categories. Each one is a real CVE you exploit end to end.
        </p>
      </header>

      <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, CVE, or category…"
            aria-label="Search challenges"
            className="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <FilterGroup label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
          <FilterGroup
            label="Difficulty"
            options={DIFFICULTIES}
            value={difficulty}
            onChange={setDifficulty}
          />
        </div>
      </div>

      <p className="mb-4 text-sm text-faint" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "challenge" : "challenges"}
        {loading ? " (loading latest…)" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          No challenges match these filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ChallengeCard key={c.slug} challenge={c} solved={solvedSet.has(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
