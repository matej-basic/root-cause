import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 600; // matches CATALOG_REVALIDATE; must be a literal

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const challenges = await getCatalog();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/challenges`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/cli`, changeFrequency: "monthly", priority: 0.6 },
    ...challenges.map((c) => ({
      url: `${SITE_URL}/challenges/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
