import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, DoorOpen } from "lucide-react";
import { SiteHeader } from "@/components/browse/site-header";
import { AmenityList } from "@/components/listing/amenity-list";
import { CampusCommutes } from "@/components/listing/campus-commutes";
import { ContactCard, MobileContactBar } from "@/components/listing/contact-card";
import { ListingLocation } from "@/components/listing/listing-location";
import { PhotoGallery } from "@/components/listing/photo-gallery";
import { ReportListing } from "@/components/listing/report-listing";
import { ListingDates } from "@/components/listing/listing-dates";
import { ROOM_TYPE_LABEL, formatDateRange, formatPrice } from "@/lib/browse";
import { getListing } from "@/lib/listing";
import { getReferenceData } from "@/lib/reference-data";

type Params = Promise<{ id: string }>;

const shortDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", ...opts });

function titleFor(l: { roomType: keyof typeof ROOM_TYPE_LABEL; unitLabel: string | null }) {
  return `${ROOM_TYPE_LABEL[l.roomType]}${l.unitLabel ? ` ${l.unitLabel}` : ""}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found | RU Subletting" };
  const title = `${titleFor(listing)}${listing.street ? ` on ${listing.street}` : ""}`;
  const description = `${formatPrice(listing.price)}/mo, ${formatDateRange(listing.start, listing.end)}. Sublet near Rutgers.`;
  return {
    title: `${title} | RU Subletting`,
    description,
    openGraph: { title, description, images: listing.photos.slice(0, 1) },
  };
}

export default function ListingPage({ params }: { params: Params }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:px-7 lg:pb-16">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to browse
        </Link>
        <Suspense fallback={<ListingSkeleton />}>
          <ListingContent params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function ListingContent({ params }: { params: Params }) {
  const { id } = await params;
  const [listing, reference] = await Promise.all([getListing(id), getReferenceData()]);
  if (!listing) notFound();

  const title = titleFor(listing);
  const place = [listing.street, listing.neighborhood !== listing.street ? listing.neighborhood : null]
    .filter(Boolean)
    .join(", ");
  const weeks = Math.max(
    1,
    Math.round((Date.parse(`${listing.end}T00:00:00Z`) - Date.parse(`${listing.start}T00:00:00Z`)) / (7 * 86_400_000)),
  );
  const facts = [
    listing.beds != null && { icon: BedDouble, text: `${listing.beds} ${listing.beds === 1 ? "bedroom" : "bedrooms"} total` },
    listing.baths != null && { icon: Bath, text: `${listing.baths} ${listing.baths === 1 ? "bath" : "baths"}` },
    { icon: DoorOpen, text: ROOM_TYPE_LABEL[listing.roomType] },
  ].filter(Boolean) as { icon: typeof BedDouble; text: string }[];

  return (
    <>
      <PhotoGallery photos={listing.photos} alt={`${title}${listing.street ? ` on ${listing.street}` : ""}`} dimmed={listing.status === "taken"} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="min-w-0">
          {listing.status === "taken" && (
            <p role="status" className="mb-5 rounded-lg border border-rule bg-muted px-4 py-3 text-sm">
              <span className="font-medium">This place has been taken.</span>{" "}
              <Link href="/" className="font-medium text-brand underline-offset-4 hover:underline">
                Browse places still available
              </Link>
            </p>
          )}

          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
            {place && <p className="mt-1 text-muted-foreground">{place}</p>}
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {facts.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-1.5">
                  <Icon className="size-4 text-accent-foreground" strokeWidth={1.75} aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </header>

          <Section title="Dates">
            <p className="mb-5 flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-xl font-semibold">{formatDateRange(listing.start, listing.end)}</span>
              <span className="text-sm text-muted-foreground">
                about {weeks} {weeks === 1 ? "week" : "weeks"}
              </span>
            </p>
            <ListingDates start={listing.start} end={listing.end} semesters={reference.semesters} />
          </Section>

          <Section title="Getting to campus">
            <CampusCommutes campuses={listing.campuses} />
            <p className="mt-4 text-xs text-muted-foreground">
              Estimates from the approximate location. Walking assumes city streets; bus times include the wait. Dashed lines
              are bus trips.
            </p>
          </Section>

          <Section title="What's included">
            <AmenityList slugs={listing.amenities} amenities={reference.amenities} />
          </Section>

          {listing.description && (
            <Section title="About this place">
              <p className="max-w-[65ch] whitespace-pre-line leading-relaxed">{listing.description}</p>
            </Section>
          )}

          <Section title="Location">
            <ListingLocation
              listingId={listing.id}
              lat={listing.lat}
              lng={listing.lng}
              neighborhood={listing.neighborhood}
              campuses={reference.campuses}
            />
          </Section>

          <Section title="Posted by">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-11 place-items-center rounded-full bg-brand-soft font-semibold text-accent-foreground"
              >
                {(listing.ownerName ?? "?").trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{listing.ownerName ?? "A member"}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {shortDate(listing.ownerSince, { month: "long", year: "numeric" })}. Posted{" "}
                  {shortDate(listing.createdAt, { month: "short", day: "numeric" })}.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <ReportListing listingId={listing.id} ownerId={listing.ownerId} />
            </div>
          </Section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ContactCard
            listingId={listing.id}
            ownerId={listing.ownerId}
            title={title}
            price={listing.price}
            start={listing.start}
            end={listing.end}
            status={listing.status}
          />
        </aside>
      </div>

      <MobileContactBar price={listing.price} start={listing.start} end={listing.end} status={listing.status} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-rule pt-8">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading listing">
      <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-muted md:aspect-[2/1]" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-24 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
