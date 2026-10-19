import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChallengeDetailView } from "@/components/ChallengeDetailView";
import { getCatalog, getCatalogChallenge, metaDescription } from "@/lib/catalog";
import { OG_BASE, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

export const revalidate = 600; // matches CATALOG_REVALIDATE; must be a literal

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const challenges = await getCatalog();
  return challenges.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await getCatalogChallenge(slug);
  if (!challenge) return { title: "Challenge not found", robots: { index: false } };

  // Keep the full <title> near 60 characters; long names drop the suffix.
  const base = challenge.cveId
    ? `${challenge.title} (${challenge.cveId}) CTF lab`
    : `${challenge.title} CTF lab`;
  const title = base.length + ` · ${SITE_NAME}`.length > 60 ? { absolute: base } : base;
  const description = metaDescription(
    `${challenge.summary} Free hands-on ${challenge.cveId || challenge.category} lab: run it locally with Docker and capture the flag.`,
  );
  const url = `/challenges/${challenge.slug}`;

  return {
    title,
    description,
    keywords: [
      challenge.cveId,
      `${challenge.category} security`,
      `${challenge.difficulty} CTF`,
      "CTF challenge",
      "exploit lab",
    ].filter(Boolean),
    alternates: { canonical: url },
    // The segment's opengraph-image supplies og:image; twitter autofills from it.
    openGraph: { ...OG_BASE, type: "article", url, title: base, description },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ChallengePage({ params }: Props) {
  const { slug } = await params;
  const challenge = await getCatalogChallenge(slug);
  if (!challenge) notFound();

  const url = `${SITE_URL}/challenges/${challenge.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: challenge.title,
        description: challenge.summary,
        url,
        learningResourceType: "Capture-the-flag lab",
        educationalLevel: challenge.difficulty,
        teaches: challenge.cveId
          ? `Exploiting ${challenge.cveId}`
          : `${challenge.category} security`,
        isAccessibleForFree: true,
        inLanguage: "en",
        provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Challenges", item: `${SITE_URL}/challenges` },
          { "@type": "ListItem", position: 3, name: challenge.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <ChallengeDetailView initial={challenge} />
    </>
  );
}
