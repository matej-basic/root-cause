"use client";

import { useState } from "react";
import { AlertTriangle, CircleCheck, Flag, Lock, XCircle } from "lucide-react";
import { submitFlag } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SubmitResult } from "@/lib/types";
import { SignInButton } from "./SignInButton";

function Notice({
  tone,
  children,
}: {
  tone: "success" | "error" | "warn" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-accent/30 bg-accent-soft text-accent-strong",
    error: "border-[#ff8a9c]/30 bg-[#ff8a9c]/10 text-[#ff8a9c]",
    warn: "border-[#ffcf5f]/30 bg-[#ffcf5f]/10 text-[#ffcf5f]",
    info: "border-border bg-surface-2 text-muted",
  }[tone];
  const Icon = {
    success: CircleCheck,
    error: XCircle,
    warn: AlertTriangle,
    info: Flag,
  }[tone];
  return (
    <div
      role="status"
      className={`mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium ${styles}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function renderResult(result: SubmitResult) {
  switch (result.outcome) {
    case "correct":
      return (
        <Notice tone="success">
          Correct flag. {result.pointsAwarded ? `+${result.pointsAwarded} points locked in.` : "Points locked in."}
        </Notice>
      );
    case "already_solved":
      return <Notice tone="info">You already solved this one. No extra points this time.</Notice>;
    case "wrong":
      return <Notice tone="error">That flag is not right. Check it and try again.</Notice>;
    case "submissions_disabled":
      return (
        <Notice tone="warn">
          Flag submission is turned off for this challenge. Work it hands-on in the lab.
        </Notice>
      );
    case "rate_limited":
      return <Notice tone="warn">Too many attempts. Wait a minute, then try again.</Notice>;
    case "unauthenticated":
      return <Notice tone="warn">Your session expired. Sign in again to submit.</Notice>;
    default:
      return <Notice tone="error">Could not reach the server. Try again in a moment.</Notice>;
  }
}

export function FlagSubmitForm({
  slug,
  initiallySolved = false,
}: {
  slug: string;
  initiallySolved?: boolean;
}) {
  const { isAuthed, loading, refresh } = useAuth();
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [solved, setSolved] = useState(initiallySolved);
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flag.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    const res = await submitFlag(slug, flag.trim());
    setResult(res);
    if (res.outcome === "correct" || res.outcome === "already_solved") {
      setSolved(true);
      await refresh();
    }
    setSubmitting(false);
  }

  const panel = "rounded-2xl border border-border bg-surface p-5";

  if (loading) {
    return <div className={`${panel} h-28 animate-pulse`} aria-hidden="true" />;
  }

  if (!isAuthed) {
    return (
      <div className={panel}>
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Lock className="h-4 w-4 text-faint" aria-hidden="true" /> Submit the flag
        </h3>
        <p className="mt-2 text-sm text-muted">
          Sign in to submit a flag and track your solves on the leaderboard.
        </p>
        <div className="mt-4">
          <SignInButton variant="primary" returnTo={`/challenges/${slug}`} />
        </div>
      </div>
    );
  }

  if (solved && !result) {
    return (
      <div className={panel}>
        <Notice tone="success">You have solved this challenge.</Notice>
      </div>
    );
  }

  return (
    <div className={panel}>
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Flag className="h-4 w-4 text-accent-strong" aria-hidden="true" /> Submit the flag
      </h3>
      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor="flag-input" className="sr-only">
          Flag
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id="flag-input"
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="flag{...}"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !flag.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-[#04120c] transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Submit"}
          </button>
        </div>
      </form>
      {result && renderResult(result)}
    </div>
  );
}
