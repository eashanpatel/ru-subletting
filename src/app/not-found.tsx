import Link from "next/link";
import { SiteHeader } from "@/components/browse/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 md:px-7">
        <h1 className="text-2xl font-semibold tracking-tight">That page doesn&apos;t exist.</h1>
        <p className="mt-2 text-muted-foreground">The link may be old or mistyped.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:brightness-110"
        >
          Browse places
        </Link>
      </main>
    </>
  );
}
