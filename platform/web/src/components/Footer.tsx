import { ShieldCheck } from "lucide-react";
import { GitHubIcon } from "./GitHubIcon";

const REPO_URL = "https://github.com/matej-basic/forwarding-labs";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          Educational / authorized lab use only.
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 transition-colors hover:text-accent-strong"
        >
          <GitHubIcon className="h-4 w-4" />
          github.com/matej-basic/forwarding-labs
        </a>
      </div>
    </footer>
  );
}
