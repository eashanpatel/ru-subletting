import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-sheet pb-24 lg:pb-0">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-7">
        <p>
          <span className="font-medium text-foreground">
            <span className="font-mono text-brand">RU</span> Subletting
          </span>{" "}
          is made by students and isn&apos;t affiliated with Rutgers University.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/listings/new" className="hover:text-foreground">
            Post a sublet
          </Link>
          <Link href="/account" className="hover:text-foreground">
            Account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
