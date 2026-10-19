import Link from "next/link";
import { Flag, Search, Terminal, Trophy } from "lucide-react";
import { SignInButton } from "@/components/SignInButton";
import { ChallengePreview } from "@/components/ChallengePreview";
import { LeaderboardTeaser } from "@/components/LeaderboardTeaser";
import { getCatalog } from "@/lib/catalog";
import type { Metadata } from "next";
import { OG_BASE, REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, jsonLd } from "@/lib/site";

export const revalidate = 600; // matches CATALOG_REVALIDATE; must be a literal

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...OG_BASE, url: "/", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

function ExploitCard() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]"
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#39424f]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#39424f]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#39424f]" />
        <span className="ml-2 font-mono text-xs text-faint">exploit.py</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.8px] leading-7 text-[#c6d2de]">
        <span className="text-faint"># pick a target, land the exploit, submit the flag</span>
        {"\n"}
        <span className="text-[#ff8a9c]">import</span> requests
        {"\n\n"}
        r = requests.post(
        {"\n"}
        {"    "}
        <span className="text-[#7cc5ff]">f&quot;&#123;TARGET&#125;/blogposts/posts&quot;</span>,
        {"\n"}
        {"    "}data=payload, {"           "}
        <span className="text-faint"># Spring4Shell data binding</span>
        {"\n"}
        )
        {"\n"}
        flag = extract(r.text)
        {"\n"}
        <span className="text-[#ff8a9c]">print</span>(flag) {"  "}
        <span className="text-accent-strong"># flag&#123;...&#125;</span>
      </pre>
    </div>
  );
}

const STEPS = [
  {
    icon: Search,
    title: "Pick a challenge",
    body: "Each one wraps a real CVE from 2021 to 2026, or a single bug class, in its own sandboxed, vulnerable app.",
  },
  {
    icon: Terminal,
    title: "Exploit the bug",
    body: "Reach the vulnerable endpoint, build the payload, and get code running or data leaking.",
  },
  {
    icon: Flag,
    title: "Submit the flag",
    body: "Pull the flag off the box and submit it. Correct flags lock in your points once.",
  },
  {
    icon: Trophy,
    title: "Climb the board",
    body: "Points and solve times rank you against everyone else working the same labs.",
  },
];

export default async function LandingPage() {
  const catalog = await getCatalog();
  const counts = {
    challenges: catalog.length,
    categories: new Set(catalog.map((c) => c.category)).size,
    points: catalog.reduce((sum, c) => sum + (c.points ?? 0), 0),
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        sameAs: [REPO_URL],
      },
    ],
  };
  const stats = [
    { v: String(counts.challenges), l: counts.challenges === 1 ? "challenge" : "challenges" },
    { v: String(counts.categories), l: counts.categories === 1 ? "category" : "categories" },
    { v: counts.points.toLocaleString("en-US"), l: "points on offer" },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      {/* Hero */}
      <section className="grid items-center gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:py-20">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-strong">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" aria-hidden="true" />
            Sandboxed CTF labs
          </span>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.07] tracking-tight">
            Learn to exploit the bugs that{" "}
            <span className="text-accent-strong">shaped security</span>.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-muted">
            A hands-on capture-the-flag built on real historical CVEs and small apps that each
            isolate one bug class. Every challenge is a deliberately vulnerable app in its own
            isolated lab, so you learn to recognize and exploit that class of bug, safely.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <SignInButton variant="primary" returnTo="/challenges" />
            <Link
              href="/challenges"
              className="inline-flex items-center justify-center rounded-[10px] border border-border bg-surface px-5 py-3 text-[15px] font-semibold text-fg transition-colors hover:border-border-strong"
            >
              Browse challenges
            </Link>
          </div>
          <dl className="mt-8 flex flex-wrap gap-8">
            {stats.map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-2xl font-bold">{s.v}</dd>
                <p className="mt-0.5 text-[12.5px] text-faint">{s.l}</p>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0 md:order-last">
          <ExploitCard />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="py-6">
        <h2 id="how-heading" className="font-display text-2xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent-strong">
                  <step.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-3 font-semibold text-fg">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Live challenge preview */}
      <div className="py-12">
        <ChallengePreview initial={catalog} />
      </div>

      {/* Leaderboard teaser (hides itself when empty) */}
      <div className="pb-16">
        <LeaderboardTeaser />
      </div>
    </div>
  );
}
