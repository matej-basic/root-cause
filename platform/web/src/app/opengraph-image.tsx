import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Root Cause: hands-on CTF labs built on real CVEs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    kicker: "Free capture-the-flag labs",
    title: "Learn to exploit the bugs that shaped security",
    footer: "Real CVEs and single-bug-class apps, run locally in Docker",
  });
}
