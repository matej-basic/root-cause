"use client";

import { useState } from "react";
import { AlertTriangle, KeyRound, RefreshCw } from "lucide-react";
import { generateApiKey } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CopyButton } from "./CopyButton";

const CODE = "rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-accent-strong";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#04120c] transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50";
const GHOST_BTN =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-border-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-50";

export function ApiKeySection() {
  const { apiKey, refresh } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exists = !!apiKey?.exists;

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    const res = await generateApiKey();
    if (res.ok) {
      setPlaintext(res.key);
      await refresh(); // refresh exists + prefix from /me
    } else {
      setError(
        res.reason === "unauthenticated"
          ? "Your session expired. Sign in again to manage your key."
          : "Could not reach the server. Try again in a moment.",
      );
    }
    setGenerating(false);
  }

  return (
    <section aria-labelledby="apikey-heading" className="mt-10">
      <h2 id="apikey-heading" className="font-display text-xl font-bold tracking-tight">
        API key
      </h2>
      <p className="mt-2 text-sm text-muted">
        The rootcause CLI and the docker-compose flagger use this key to mint a per-run
        flag for every challenge you launch. Pass it as{" "}
        <code className={CODE}>ROOTCAUSE_API_KEY</code>.
      </p>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
        {plaintext ? (
          <div>
            <div className="flex items-start gap-2.5 rounded-lg border border-[#ffcf5f]/30 bg-[#ffcf5f]/10 px-3.5 py-3 text-sm font-medium text-[#ffcf5f]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Copy it now. This key will not be shown again.</span>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-[#0c1118] px-3.5 py-2.5 font-mono text-sm text-accent-strong">
                {plaintext}
              </code>
              <CopyButton value={plaintext} label="Copy key" />
            </div>
          </div>
        ) : exists ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2.5 text-sm text-muted">
              <KeyRound className="h-4 w-4 text-faint" aria-hidden="true" />
              Active key
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-fg">
                {apiKey?.prefix ? `${apiKey.prefix}…` : "rc_…"}
              </code>
            </span>
            <button type="button" onClick={generate} disabled={generating} className={GHOST_BTN}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted">You have not generated a key yet.</span>
            <button type="button" onClick={generate} disabled={generating} className={PRIMARY_BTN}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {generating ? "Generating…" : "Generate API key"}
            </button>
          </div>
        )}

        {exists && !plaintext && (
          <p className="mt-3 text-xs text-faint">
            Regenerating replaces the old key. Anything still using it stops working.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </section>
  );
}
