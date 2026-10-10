// Small presentation helpers.

const CATEGORY_LABELS: Record<string, string> = {
  web: "web",
  pwn: "pwn",
  crypto: "crypto",
  misc: "misc",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

// Tailwind class strings per category/difficulty. Written as full literal
// strings so the Tailwind JIT scanner keeps them.
export const CATEGORY_BADGE: Record<string, string> = {
  web: "text-[#7cc5ff] bg-[#7cc5ff]/10",
  pwn: "text-[#ff8a9c] bg-[#ff8a9c]/10",
  crypto: "text-[#c08bff] bg-[#c08bff]/10",
  misc: "text-[#ffcf5f] bg-[#ffcf5f]/10",
};

export const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "text-[#34d399] bg-[#34d399]/10",
  medium: "text-[#ffcf5f] bg-[#ffcf5f]/10",
  hard: "text-[#ff8a9c] bg-[#ff8a9c]/10",
};

export function nvdUrl(cveId: string): string {
  return `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cveId)}`;
}

export function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

// Compact number with thousands separators (e.g. 1800 → "1,800").
export function formatNumber(n: number): string {
  try {
    return n.toLocaleString("en-US");
  } catch {
    return String(n);
  }
}

// Human-friendly timestamp. Returns both an absolute label and a relative hint;
// callers pick. Safe on bad/empty input.
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString();
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDateTime(iso);
}
