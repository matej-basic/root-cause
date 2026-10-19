import { getCatalogChallenge } from "@/lib/catalog";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Root Cause CTF challenge";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = await getCatalogChallenge(slug);
  if (!challenge) {
    return renderOgImage({ kicker: "CTF challenge", title: slug, footer: "root-cause.matejbasic.com" });
  }
  return renderOgImage({
    kicker: [challenge.cveId, challenge.category, challenge.difficulty].filter(Boolean).join(" · "),
    title: challenge.title,
    footer: `${challenge.points} points · run it locally with Docker`,
  });
}
