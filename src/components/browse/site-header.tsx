import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HeaderAccount, SignInLink } from "./header-account";
import { MobileMenu } from "./mobile-menu";

const NAV = [
  { href: "/", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/my-listings", label: "My listings" },
];

export function SiteHeader({ current = "/" }: { current?: string }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-rule bg-sheet/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 md:gap-8 md:px-7">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-lg font-semibold tracking-tight"
          aria-label="RU Subletting, home"
        >
          <span className="font-mono text-brand">RU</span> Subletting
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === current ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={<SignInLink />}>
            <HeaderAccount />
          </Suspense>
          <Link
            href="/listings/new"
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand px-3 text-sm font-semibold text-brand-foreground transition-[transform,filter] hover:brightness-110 active:scale-[0.98] sm:px-4"
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
