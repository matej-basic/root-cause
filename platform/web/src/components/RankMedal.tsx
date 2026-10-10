// Rank indicator with gold / silver / bronze styling for the top three.

const MEDAL: Record<number, string> = {
  1: "text-gold",
  2: "text-silver",
  3: "text-bronze",
};

export function RankMedal({ rank, className = "" }: { rank: number; className?: string }) {
  const color = MEDAL[rank] ?? "text-muted";
  return (
    <span
      className={`inline-grid w-7 shrink-0 place-items-center font-display text-[15px] font-bold tabular-nums ${color} ${className}`}
    >
      {rank}
    </span>
  );
}
