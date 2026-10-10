import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-accent-strong">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">That route does not exist here.</p>
      <Link
        href="/"
        className="mt-6 rounded-[10px] bg-accent px-5 py-3 text-[15px] font-semibold text-[#04120c] transition-colors hover:bg-accent-strong"
      >
        Back home
      </Link>
    </div>
  );
}
