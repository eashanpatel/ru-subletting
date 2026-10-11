"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AtSign, Bookmark, Ghost, Link2, Loader2, Mail, MessageCircle, MessageSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useFavorites } from "@/hooks/use-favorites";
import { type ListingStatus, formatDateRange, formatPrice } from "@/lib/browse";
import { CONTACT_KINDS, type ContactKind, contactHref } from "@/lib/listing-form";

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
            This is your listing. Signed-in visitors see the contact methods you added.
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

const CONTACT_ICONS: Record<ContactKind, typeof Mail> = {
  email: Mail,
  phone: MessageSquare,
  whatsapp: MessageCircle,
  instagram: AtSign,
  snapchat: Ghost,
  other: Link2,
};

function ContactDetails({ listingId, title }: { listingId: string; title: string }) {
  const contacts = useQuery({
    queryKey: ["listing-contacts", listingId],
    queryFn: async () => {
      const { data, error } = await createClient().rpc("get_listing_contacts", { p_listing_id: listingId });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (contacts.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading contact details
      </p>
    );
  }
  if (contacts.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Contact details didn&apos;t load.{" "}
        <button type="button" onClick={() => contacts.refetch()} className="font-medium underline underline-offset-4">
          Try again
        </button>
      </p>
    );
  }
  if (contacts.data.length === 0) {
    return <p className="text-sm text-muted-foreground">The person subletting hasn&apos;t shared contact details yet.</p>;
  }

  const subject = `Your sublet on RU Subletting: ${title}`;
  return (
    <ul className="flex flex-col gap-2">
      {contacts.data.map((c, i) => {
        const Icon = CONTACT_ICONS[c.kind];
        const href = contactHref(c.kind, c.value, subject);
        const inner = (
          <>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs font-normal opacity-80">{CONTACT_KINDS[c.kind].label}</span>
              <span className="block truncate font-mono text-sm">{c.value}</span>
            </span>
          </>
        );
        const cls = cn(
          "flex min-h-12 items-center gap-3 rounded-lg px-4 py-2 text-left font-semibold",
          i === 0 ? "bg-brand text-brand-foreground hover:brightness-110" : "border border-input hover:border-foreground/40",
        );
        return (
          <li key={`${c.kind}-${i}`}>
            {href ? (
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
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
