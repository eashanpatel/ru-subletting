"use client";

import { useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

const LINKS = [
  { href: "/", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/my-listings", label: "My listings" },
  { href: "/listings/new", label: "Post a sublet" },
];

/** Phone navigation: a sheet from the right with every destination and account actions. */
export function MobileMenu({ current }: { current: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { userId, email, ready } = useSession();
  const close = () => ref.current?.close();

  const itemClass =
    "flex h-12 items-center rounded-lg px-3 text-base font-medium hover:bg-muted aria-[current=page]:bg-muted";

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted md:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-0 ml-auto h-dvh max-h-none w-[min(20rem,85vw)] max-w-none border-l border-rule bg-sheet p-0 text-foreground backdrop:bg-foreground/30"
      >
        <div className="flex h-16 items-center justify-between border-b border-rule px-4">
          <span className="text-lg font-semibold tracking-tight">
            <span className="font-mono text-brand">RU</span> Subletting
          </span>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close menu"
            className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 p-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={current === l.href ? "page" : undefined}
              className={itemClass}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 border-t border-rule p-3">
          {!ready ? (
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
          ) : userId ? (
            <>
              <Link href="/account" onClick={close} aria-current={current === "/account" ? "page" : undefined} className={itemClass}>
                <span className="min-w-0">
                  Account
                  {email && <span className="block truncate text-sm font-normal text-muted-foreground">{email}</span>}
                </span>
              </Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className={cn(itemClass, "w-full text-left")}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              onClick={close}
              className="flex h-12 items-center justify-center rounded-lg bg-brand text-base font-semibold text-brand-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </dialog>
    </>
  );
}
