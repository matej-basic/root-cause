"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { setToken, takeReturnTo } from "@/lib/token";
import { SignInButton } from "@/components/SignInButton";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You cancelled the GitHub sign-in.",
  state_mismatch: "We could not verify that sign-in. Please try again.",
  oauth_failed: "GitHub sign-in did not complete. Please try again.",
  missing_token: "The sign-in response was missing a token. Please try again.",
};

function friendlyError(code: string): string {
  return ERROR_MESSAGES[code] ?? `Sign-in failed (${code}). Please try again.`;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const token = params.get("token");
      const errCode = params.get("error");

      // Strip the fragment immediately so the token never lingers in the URL.
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch {
        /* ignore */
      }

      if (token) {
        setToken(token);
        await refresh();
        if (cancelled) return;
        const dest = takeReturnTo() || "/challenges";
        router.replace(dest.startsWith("/") ? dest : "/challenges");
        return;
      }

      if (!cancelled) setError(errCode ? friendlyError(errCode) : friendlyError("missing_token"));
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      {error ? (
        <>
          <AlertTriangle className="h-8 w-8 text-[#ffcf5f]" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold">Sign-in didn&apos;t work</h1>
          <p className="mt-2 text-muted">{error}</p>
          <div className="mt-6 flex items-center gap-3">
            <SignInButton variant="primary" returnTo="/challenges" label="Try again" />
            <Link
              href="/"
              className="rounded-[10px] border border-border bg-surface px-5 py-3 text-[15px] font-semibold text-fg transition-colors hover:border-border-strong"
            >
              Back home
            </Link>
          </div>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-accent-strong" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold">Signing you in…</h1>
          <p className="mt-2 text-muted">One moment while we set up your session.</p>
        </>
      )}
    </div>
  );
}
