import type { Metadata } from "next";
import { ChallengeBrowser } from "@/components/ChallengeBrowser";
import { getCatalog } from "@/lib/catalog";
import { OG_BASE, OG_DEFAULT_IMAGE, SITE_URL, jsonLd } from "@/lib/site";

export const revalidate = 600; // matches CATALOG_REVALIDATE; must be a literal

export const metadata: Metadata = {
  title: "Free CTF challenges: CVE and web security labs",
  description:
    "Every Root Cause lab: real CVEs like Spring4Shell and Text4Shell, plus SQL injection, SSRF, XXE, JWT, IDOR and crypto. Filter by category and difficulty.",
  alternates: { canonical: "/challenges" },
  openGraph: {
    ...OG_BASE,
    url: "/challenges",
    title: "Free CTF challenges: CVE and web security labs",
    images: [OG_DEFAULT_IMAGE],
  },
};

export default async function ChallengesPage() {
  const challenges = await getCatalog();
  const cveCount = challenges.filter((c) => c.cveId).length;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Root Cause CTF challenges",
    numberOfItems: challenges.length,
    itemListElement: challenges.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/challenges/${c.slug}`,
      name: c.title,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemList) }}
      />
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Challenges</h1>
        <p className="mt-2 text-muted">
          {challenges.length} labs, {cveCount} of them built on a real CVE. Run one locally with
          Docker, exploit it end to end, and submit the flag.
        </p>
      </header>
      <ChallengeBrowser initial={challenges} />
    </div>
  );
}
