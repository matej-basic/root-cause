import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Ranking of Root Cause players by points and solve time across every CTF lab.",
  // Client-rendered and thin for now, so keep it out of the index.
  robots: { index: false, follow: true },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
