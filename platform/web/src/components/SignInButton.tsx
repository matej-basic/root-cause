"use client";

import { useAuth } from "@/lib/auth";
import { GitHubIcon } from "./GitHubIcon";

type Variant = "primary" | "ghost" | "nav";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-accent text-[#04120c] hover:bg-accent-strong px-5 py-3 text-[15px] font-semibold rounded-[10px]",
  ghost:
    "border border-border bg-surface text-fg hover:border-border-strong px-5 py-3 text-[15px] font-semibold rounded-[10px]",
  nav: "bg-accent text-[#04120c] hover:bg-accent-strong px-[15px] py-[9px] text-sm font-semibold rounded-[9px]",
};

export function SignInButton({
  variant = "primary",
  returnTo,
  label = "Sign in with GitHub",
  className = "",
}: {
  variant?: Variant;
  returnTo?: string;
  label?: string;
  className?: string;
}) {
  const { signIn } = useAuth();
  return (
    <button
      type="button"
      onClick={() => signIn(returnTo)}
      className={`inline-flex items-center justify-center gap-2 transition-colors ${STYLES[variant]} ${className}`}
    >
      <GitHubIcon className="h-[18px] w-[18px]" />
      {label}
    </button>
  );
}
