"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useFavorites } from "@/hooks/use-favorites";
import { type ListingStatus, formatDateRange, formatPrice } from "@/lib/browse";

type Props = {
  listingId: string;
  ownerId: string;
  title: string;
  price: number;
  start: string;
  end: string;
  status: ListingStatus;
};

const TIPS = [
  "See the place in person or on a live video call before paying anything.",
  "Never wire money, pay in gift cards, or send a deposit to hold a room you haven't seen.",
  "Ask to see the original lease and confirm the landlord allows subletting.",
];

/** Price, save, and how to reach the person subletting. */
export function ContactCard(props: Props) {
  const { listingId, ownerId, title, price, start, end, status } = props;
  const router = useRouter();
  const { userId, ready } = useSession();
  const { savedIds, toggle } = useFavorites(userId);
  const saved = savedIds.has(listingId);
  const isOwner = !!userId && userId === ownerId;
  const open = status === "active";

  function onSave() {
    if (!ready) return;
    if (!userId) return router.push("/sign-in");
    toggle.mutate({ listingId, save: !saved });
  }

  return (
    <div id="contact" className="scroll-mt-24 rounded-lg border border-rule bg-sheet p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-3xl font-semibold tracking-tight">
          <span className={cn(status === "taken" && "text-muted-foreground line-through decoration-1")}>{formatPrice(price)}</span>
          <span className="font-sans text-base font-normal tracking-normal text-muted-foreground"> /mo</span>
        </p>
        {open && !isOwner && (
          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors active:scale-[0.98]",
              saved ? "border-brand bg-brand text-brand-foreground" : "border-input hover:border-foreground/40",
            )}
          >
            <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
            {saved ? "Saved" : "Save"}
          </button>
        )}
      </div>
      <p className="mt-1 font-mono text-sm text-muted-foreground">{formatDateRange(start, end)}</p>

      <div className="mt-5 border-t border-rule pt-5">
        {!open ? (
          <p className="text-sm text-muted-foreground">
            {status === "taken" ? "This place has been taken, so contact details are hidden." : "This listing isn't accepting messages right now."}
          </p>
        ) : !ready ? (
          <div className="h-11 animate-pulse rounded-lg bg-muted" />
        ) : isOwner ? (
          <p className="text-sm">
            This is your listing. People who are signed in see the contact details you chose to share.
          </p>
        ) : !userId ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">Sign in to see how to reach the person subletting.</p>
            <Link
              href="/sign-in"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:brightness-110 active:scale-[0.98]"
            >
              Sign in to contact
            </Link>
          </>
        ) : (
          <ContactDetails listingId={listingId} title={title} />
        )}
      </div>

      {open && (
        <div className="mt-5 rounded-md bg-muted/70 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <ShieldCheck className="size-4 text-accent-foreground" aria-hidden />
            Before you pay
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
            {TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContactDetails({ listingId, title }: { listingId: string; title: string }) {
  const contact = useQuery({
    queryKey: ["listing-contact", listingId],
    queryFn: async () => {
      const { data, error } = await createClient().rpc("get_listing_contact", { p_listing_id: listingId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  if (contact.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading contact details
      </p>
    );
  }
  if (contact.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Contact details didn&apos;t load.{" "}
        <button type="button" onClick={() => contact.refetch()} className="font-medium underline underline-offset-4">
          Try again
        </button>
      </p>
    );
  }

  const email = contact.data?.contact_email;
  const phone = contact.data?.contact_phone;
  if (!email && !phone) {
    return <p className="text-sm text-muted-foreground">The person subletting hasn&apos;t shared contact details yet.</p>;
  }

  const subject = encodeURIComponent(`Your sublet on RU Subletting: ${title}`);
  return (
    <div className="flex flex-col gap-2">
      {email && (
        <a
          href={`mailto:${email}?subject=${subject}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110 active:scale-[0.98]"
        >
          <Mail className="size-4" aria-hidden />
          Email {email}
        </a>
      )}
      {phone && (
        <a
          href={`sms:${phone}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input px-4 text-sm font-semibold hover:border-foreground/40 active:scale-[0.98]"
        >
          <Phone className="size-4" aria-hidden />
          Text <span className="font-mono">{phone}</span>
        </a>
      )}
    </div>
  );
}

/** Phone-only bar so price and contact stay in reach while scrolling. */
export function MobileContactBar({ price, start, end, status }: Pick<Props, "price" | "start" | "end" | "status">) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-sheet/95 px-4 py-3 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-semibold leading-tight">
            {formatPrice(price)}
            <span className="font-sans text-sm font-normal text-muted-foreground"> /mo</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">{formatDateRange(start, end)}</p>
        </div>
        {status === "active" && (
          <a
            href="#contact"
            className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground active:scale-[0.98]"
          >
            Contact
          </a>
        )}
      </div>
    </div>
  );
}
