"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Terminal, Trophy, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./Avatar";
import { SignInButton } from "./SignInButton";

function Brand() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-[17px] font-bold tracking-tight"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-strong font-mono text-[15px] font-bold text-[#04120c]">
        fl
      </span>
      forwarding<span className="text-faint">-labs</span>
    </Link>
  );
}

function useActive(href: string) {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Text link, shown from the `sm` breakpoint up.
function NavLink({ href, label }: { href: string; label: string }) {
  const active = useActive(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-[14.5px] font-medium transition-colors ${
        active ? "text-fg" : "text-muted hover:text-fg"
      }`}
    >
      {label}
    </Link>
  );
}

// Compact icon link for phone widths, keeping navigation reachable without
// overflowing the bar.
function IconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Terminal;
}) {
  const active = useActive(href);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </Link>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const displayName = user.name || user.username;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition-colors hover:border-border-strong"
      >
        <Avatar src={user.avatarUrl} name={displayName} size={28} />
        <span className="hidden max-w-[11ch] truncate text-sm font-medium text-fg sm:inline">
          {user.username}
        </span>
        <ChevronDown className="h-4 w-4 text-faint" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)]"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
            <p className="truncate text-xs text-faint">@{user.username}</p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" /> Profile
          </Link>
          <Link
            href="/leaderboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Trophy className="h-4 w-4" aria-hidden="true" /> Leaderboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const { isAuthed, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-5">
        <Brand />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-6">
          <div className="hidden items-center gap-6 sm:flex">
            <NavLink href="/challenges" label="Challenges" />
            <NavLink href="/leaderboard" label="Leaderboard" />
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            <IconLink href="/challenges" label="Challenges" icon={Terminal} />
            <IconLink href="/leaderboard" label="Leaderboard" icon={Trophy} />
          </div>
          {loading ? (
            <span className="h-8 w-8 animate-pulse rounded-full bg-surface-2" aria-hidden="true" />
          ) : isAuthed ? (
            <AccountMenu />
          ) : (
            <SignInButton variant="nav" label="Sign in" />
          )}
        </div>
      </nav>
    </header>
  );
}
