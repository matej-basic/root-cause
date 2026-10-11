"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Download, Terminal } from "lucide-react";
import { CopyButton } from "./CopyButton";

// Canonical per-challenge docker-compose (see platform/API_CONTRACT.md). Only
// the slug and the challenge image differ between challenges; the flagger
// sidecar image and everything else are fixed. The literal ${ROOTCAUSE_API_KEY}
// is a compose variable the user supplies from their shell, so no secret is
// written into the file.
function composeFor(slug: string, image: string): string {
  return `services:
  flagger:
    image: matejbasic/rootcause-flagger:1.0
    environment:
      ROOTCAUSE_API_URL: https://root-cause-api.matejbasic.com
      ROOTCAUSE_API_KEY: \${ROOTCAUSE_API_KEY}
      ROOTCAUSE_CHALLENGE: ${slug}
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
  challenge:
    image: ${image}
    depends_on:
      flagger:
        condition: service_completed_successfully
    environment:
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
    ports:
      - "8080:8080"
volumes:
  flag:
`;
}

const GHOST_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-border-strong hover:text-fg";

export function RunChallenge({ slug, image }: { slug: string; image: string }) {
  const compose = useMemo(() => composeFor(slug, image), [slug, image]);
  const cli = `rootcause start ${slug}`;

  const download = useCallback(() => {
    try {
      const blob = new Blob([compose], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compose.yml";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Programmatic download can be blocked; the Copy button still works.
    }
  }, [compose]);

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Terminal className="h-4 w-4 text-accent-strong" aria-hidden="true" /> Run this challenge
      </h2>
      <p className="mt-2 text-sm text-muted">
        Spin it up locally with Docker. The flagger sidecar fetches a per-run flag into a
        shared volume, then the challenge container boots and reads it.
      </p>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-faint">compose.yml</span>
          <div className="flex items-center gap-2">
            <CopyButton value={compose} label="Copy" />
            <button type="button" onClick={download} className={GHOST_BTN}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
            </button>
          </div>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-[10px] border border-border bg-[#0c1118] p-4 font-mono text-[0.8rem] leading-[1.7] text-[#c6d2de]">
          <code>{compose}</code>
        </pre>
      </div>

      <div className="mt-5">
        <span className="font-mono text-xs text-faint">one-line CLI</span>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-[#0c1118] px-3.5 py-2.5 font-mono text-sm text-accent-strong">
            {cli}
          </code>
          <CopyButton value={cli} label="Copy" />
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        The{" "}
        <Link href="/cli" className="font-semibold text-accent-strong hover:underline">
          rootcause CLI
        </Link>{" "}
        does all of this in one command. Running a challenge needs your API key, which you
        generate in your{" "}
        <Link href="/profile" className="font-semibold text-accent-strong hover:underline">
          profile
        </Link>
        .
      </p>
    </section>
  );
}
