"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Images, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Desktop: one large photo with up to four beside it. Phone: a swipeable
 * strip with a counter. Either opens every photo in a full-screen list.
 */
export function PhotoGallery({ photos, alt, dimmed }: { photos: string[]; alt: string; dimmed?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-lg border border-dashed border-input bg-muted text-sm text-muted-foreground">
        No photos yet
      </div>
    );
  }

  function openAll(at = 0) {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => document.getElementById(`photo-${at}`)?.scrollIntoView({ block: "start" }));
  }

  const side = photos.slice(1, 5);

  return (
    <>
      {/* Phone: swipeable strip */}
      <div className={cn("relative -mx-4 md:hidden", dimmed && "opacity-60")}>
        <div
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAll(i)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center"
              aria-label={`Open photo ${i + 1} of ${photos.length}`}
            >
              <Image src={src} alt={i === 0 ? alt : ""} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-3 right-4 rounded-md bg-foreground/75 px-2 py-1 font-mono text-xs text-background">
          {index + 1} / {photos.length}
        </span>
      </div>

      {/* Desktop: mosaic */}
      <div
        className={cn(
          "relative hidden gap-2 overflow-hidden rounded-lg md:grid",
          side.length > 0 ? "aspect-[2/1] grid-cols-4 grid-rows-2" : "aspect-[16/9]",
          dimmed && "opacity-60",
        )}
      >
        <button
          type="button"
          onClick={() => openAll(0)}
          className={cn("relative bg-muted", side.length > 0 && "col-span-2 row-span-2", side.length === 1 && "col-span-2 row-span-2")}
          aria-label="Open photos"
        >
          <Image src={photos[0]} alt={alt} fill priority sizes="(min-width: 1024px) 560px, 50vw" className="object-cover" />
        </button>
        {side.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => openAll(i + 1)}
            className={cn(
              "relative bg-muted",
              side.length === 1 && "col-span-2 row-span-2",
              side.length === 2 && "col-span-2",
              side.length === 3 && i === 0 && "col-span-2",
            )}
            aria-label={`Open photo ${i + 2} of ${photos.length}`}
          >
            <Image src={src} alt="" fill sizes="(min-width: 1024px) 280px, 25vw" className="object-cover transition-opacity hover:opacity-90" />
          </button>
        ))}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => openAll(0)}
            className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-2 rounded-lg border border-rule bg-sheet px-3 text-sm font-medium shadow-sm hover:border-foreground/40"
          >
            <Images className="size-4" aria-hidden />
            Show all {photos.length} photos
          </button>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-label="All photos"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-background p-0 text-foreground backdrop:bg-foreground/40"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-background/95 px-4 py-3 backdrop-blur-sm md:px-7">
          <p className="text-sm font-medium">
            <span className="font-mono">{photos.length}</span> photos
          </p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close photos"
            className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4 md:p-7">
          {photos.map((src, i) => (
            <div key={src} id={`photo-${i}`} className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
              <Image src={src} alt={`${alt}, photo ${i + 1}`} fill sizes="(min-width: 896px) 896px, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
      </dialog>
    </>
  );
}
