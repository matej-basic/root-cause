"use client";

import { useState } from "react";
import { initialOf } from "@/lib/format";

// Round avatar. Uses the GitHub image when available and falls back to a
// gradient monogram if there is no URL or the image fails to load.
export function Avatar({
  src,
  name,
  size = 32,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };
  const showImg = src && !failed;

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external GitHub avatar; a plain img avoids next/image remote-loader cost
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`rounded-full object-cover ${className}`}
        style={dim}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-grid place-items-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-semibold text-[#04120c] ${className}`}
      style={{ ...dim, fontSize: Math.round(size * 0.42) }}
    >
      {initialOf(name)}
    </span>
  );
}
