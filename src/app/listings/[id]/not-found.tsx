import Link from "next/link";
import { SiteHeader } from "@/components/browse/site-header";

export default function ListingNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 md:px-7">
        <h1 className="text-2xl font-semibold tracking-tight">This listing isn&apos;t available</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed by the person who posted it, or the link is wrong.</p>
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
