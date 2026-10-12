/** Server-side bucket limit is 1.5 MB; aim well under it. */
const TARGET_BYTES = 600 * 1024;

/**
 * Resize and re-encode a photo in the browser before upload: longest side
 * capped at 1600px, WebP where supported (JPEG otherwise). Redrawing on a
 * canvas also strips location metadata. If a busy photo is still large, it
 * steps down quality and then size until it fits the target.
 */
export async function compressImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That photo format isn't supported. Try a JPG or PNG.");
  }

  const attempts: { maxSide: number; quality: number }[] = [
    { maxSide: 1600, quality: 0.82 },
    { maxSide: 1600, quality: 0.7 },
    { maxSide: 1280, quality: 0.7 },
    { maxSide: 1080, quality: 0.6 },
  ];

  try {
    let last: Blob | null = null;
    for (const { maxSide, quality } of attempts) {
      last = await encode(bitmap, maxSide, quality);
      if (last.size <= TARGET_BYTES) return last;
    }
    return last!;
  } finally {
    bitmap.close();
  }
}

async function encode(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that photo.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Couldn't process that photo.");
  return jpeg;
}
