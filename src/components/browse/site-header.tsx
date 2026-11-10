import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HeaderAccount, SignInLink } from "./header-account";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/my-listings", label: "My listings" },
];

export function SiteHeader({ current = "/" }: { current?: string }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-shell-rule bg-shell text-shell-foreground">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 md:gap-8 md:px-7">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg text-xl font-extrabold tracking-tight focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none"
          aria-label="RU Subletting, home"
        >
          <span className="rounded-md bg-cta px-1.5 py-0.5 text-cta-foreground">RU</span>
          Subletting
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === current ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-shell-muted transition-colors hover:bg-shell-foreground/10 hover:text-shell-foreground focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none aria-[current=page]:bg-shell-foreground/15 aria-[current=page]:text-shell-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Suspense fallback={<SignInLink />}>
            <HeaderAccount />
          </Suspense>
          <ThemeToggle className="text-shell-muted hover:bg-shell-foreground/10 hover:text-shell-foreground focus-visible:ring-shell-foreground" />
          <Link
            href="/listings/new"
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-cta px-3 text-sm font-semibold text-cta-foreground transition-[transform,filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none active:scale-[0.98] sm:px-4"
          >
            <Plus className="size-4" strokeWidth={2.25} aria-hidden />
            <span className="sm:hidden">Post</span>
            <span className="hidden sm:inline">Post a sublet</span>
          </Link>
          <MobileMenu current={current} />
        </div>
      </div>
    </header>
  );
}
