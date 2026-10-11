import Link from "next/link";
import { Terminal } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";

export const metadata = {
  title: "Install the CLI — Root Cause",
  description: "Download and install the rootcause CLI to run challenges locally.",
};

const RELEASES = "https://github.com/matej-basic/root-cause/releases/latest";

const UNIX_INSTALL = `os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
curl -fsSL -o rootcause "https://github.com/matej-basic/root-cause/releases/latest/download/rootcause-\${os}-\${arch}"
chmod +x rootcause && sudo mv rootcause /usr/local/bin/`;

const FROM_SOURCE = `cd cli
go build -o rootcause .`;

const CODE =
  "mt-3 overflow-x-auto rounded-[10px] border border-border bg-[#0c1118] p-4 font-mono text-[0.8rem] leading-[1.7] text-[#c6d2de]";

export default function CliPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
        <Terminal className="h-5 w-5 text-accent-strong" aria-hidden="true" /> Install the CLI
      </h1>
      <p className="mt-3 text-sm text-muted">
        The <code className="font-mono text-accent-strong">rootcause</code> CLI runs a challenge
        on your own machine with Docker, using the same per-challenge compose the site hands out.
        One command spins up the flagger sidecar and the challenge. Submitting flags stays on the
        website.
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">macOS / Linux</h2>
        <p className="mt-2 text-sm text-muted">
          Download the binary for your platform and put it on your PATH:
        </p>
        <div className="mt-3 flex justify-end">
          <CopyButton value={UNIX_INSTALL} label="Copy" />
        </div>
        <pre className={CODE}>
          <code>{UNIX_INSTALL}</code>
        </pre>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Windows</h2>
        <p className="mt-2 text-sm text-muted">
          Download <code className="font-mono text-accent-strong">rootcause-windows-amd64.exe</code>{" "}
          from the{" "}
          <a
            href={RELEASES}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent-strong hover:underline"
          >
            latest release
          </a>{" "}
          and add it to your PATH.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">From source</h2>
        <p className="mt-2 text-sm text-muted">
          No third-party dependencies, so a local build works with a Go toolchain:
        </p>
        <pre className={CODE}>
          <code>{FROM_SOURCE}</code>
        </pre>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Then run a challenge</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>
            Generate an API key on your{" "}
            <Link href="/profile" className="font-semibold text-accent-strong hover:underline">
              profile
            </Link>{" "}
            (it is shown once).
          </li>
          <li>
            <code className="font-mono text-accent-strong">rootcause login --key &lt;your key&gt;</code>
          </li>
          <li>
            <code className="font-mono text-accent-strong">rootcause list</code>, then{" "}
            <code className="font-mono text-accent-strong">rootcause start &lt;slug&gt;</code>
          </li>
        </ol>
        <p className="mt-4 text-sm text-muted">
          You need Docker installed and running. All releases live on{" "}
          <a
            href={RELEASES}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent-strong hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}
