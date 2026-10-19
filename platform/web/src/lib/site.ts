// Site-wide constants used for metadata, the sitemap and structured data.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://root-cause.matejbasic.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Root Cause";

export const SITE_TITLE = "Root Cause: hands-on CTF labs built on real CVEs";

export const SITE_DESCRIPTION =
  "Free CTF labs for web penetration testing: exploit real CVEs like Spring4Shell and Text4Shell, plus SQLi, SSRF, JWT and IDOR, locally in Docker.";

export const REPO_URL = "https://github.com/matej-basic/root-cause";

// Next replaces `openGraph` wholesale per segment, so every page that sets its
// own spreads this base to keep site name, locale and the default card.
export const OG_BASE = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_US",
} as const;

export const OG_DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: SITE_TITLE,
};

// JSON-LD for a <script> tag, with "<" escaped so DB text cannot close it.
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
