"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { photoUrl } from "@/lib/browse";
import { MAX_PHOTOS } from "@/lib/listing-form";

type Uploading = { key: string; preview: string; error?: string };

/**
 * Photos are compressed in the browser and uploaded straight to storage under
 * "<user>/<listing>/". The form keeps the ordered list of storage paths; the
 * first one is the cover. Files removed here are cleaned up when the listing saves.
 */
export function PhotoUploader({
  userId,
  listingId,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  userId: string;
  listingId: string;
  value: string[];
  onChange: (paths: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [dragging, setDragging] = useState(false);
  const latest = useRef(value);
  latest.current = value;

  const room = MAX_PHOTOS - value.length - uploading.filter((u) => !u.error).length;

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    if (list.length === 0) return;
    const supabase = createClient();

    await Promise.all(
      list.map(async (file) => {
        const key = crypto.randomUUID();
        const preview = URL.createObjectURL(file);
        setUploading((u) => [...u, { key, preview }]);
        try {
          const blob = await compressImage(file);
          const ext = blob.type === "image/webp" ? "webp" : "jpg";
          const path = `${userId}/${listingId}/${key}.${ext}`;
          const { error } = await supabase.storage
            .from("listing-photos")
            .upload(path, blob, { contentType: blob.type, upsert: false });
          if (error) throw new Error("Upload failed. Check your connection and try again.");
          onChange([...latest.current, path]);
          setUploading((u) => u.filter((x) => x.key !== key));
          URL.revokeObjectURL(preview);
        } catch (e) {
          setUploading((u) => u.map((x) => (x.key === key ? { ...x, error: (e as Error).message } : x)));
        }
      }),
    );
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-lg border border-dashed p-3 transition-colors",
          dragging ? "border-brand bg-brand-soft/60" : invalid ? "border-destructive" : "border-input",
        )}
      >
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-describedby={describedBy}>
          {value.map((path, i) => (
            <li key={path} className="group relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
              <Image src={photoUrl(path)!} alt={`Photo ${i + 1}`} fill sizes="240px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-md bg-foreground/80 px-2 py-0.5 text-xs font-medium text-background">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(value.filter((p) => p !== path))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md bg-sheet/90 shadow-sm hover:bg-sheet"
              >
                <X className="size-4" aria-hidden />
              </button>
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move photo ${i + 1} earlier`}
                  className="inline-flex size-8 items-center justify-center rounded-md bg-sheet/90 shadow-sm hover:bg-sheet disabled:invisible"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label={`Move photo ${i + 1} later`}
                  className="inline-flex size-8 items-center justify-center rounded-md bg-sheet/90 shadow-sm hover:bg-sheet disabled:invisible"
                >
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}

          {uploading.map((u) => (
            <li key={u.key} className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
              {/* Local preview while uploading; blob URLs can't go through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.preview} alt="" className={cn("h-full w-full object-cover", !u.error && "opacity-50")} />
              <div className="absolute inset-0 grid place-items-center p-2 text-center">
                {u.error ? (
                  <div className="rounded-md bg-sheet/95 p-2 text-xs text-destructive">
                    {u.error}
                    <button
                      type="button"
                      onClick={() => setUploading((x) => x.filter((y) => y.key !== u.key))}
                      className="mt-1 block w-full font-medium underline"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <Loader2 className="size-6 animate-spin text-foreground" aria-label="Uploading" />
                )}
              </div>
            </li>
          ))}

          {room > 0 && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-input bg-sheet text-sm font-medium transition-colors hover:border-foreground/40"
              >
                <ImagePlus className="size-5 text-accent-foreground" aria-hidden />
                Add photos
                <span className="text-xs font-normal text-muted-foreground">or drop them here</span>
              </button>
            </li>
          )}
        </ul>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-2 text-sm text-muted-foreground">
        Up to {MAX_PHOTOS} photos. The first one is the cover. Bright, wide shots of the room work best.
      </p>
    </div>
  );
}
