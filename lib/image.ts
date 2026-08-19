"use client";

import { COLOURS } from "@/lib/domain/enums";

/**
 * Downscale an uploaded photo before it ever touches storage. Wardrobe photos
 * live in localStorage as data URLs, so size discipline is not optional.
 */
export async function downscaleImage(
  file: File,
  maxEdge = 512,
  quality = 0.72,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return canvas.toDataURL("image/jpeg", quality);
}

/* ============================================================================
   Dominant colour → nearest wardrobe colour token.

   This is real analysis done on the device, not a stand-in for image
   recognition: it tells us the colour and nothing else. The user always
   confirms the result.
   ========================================================================== */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Perceptual-ish distance: weights green more heavily, like the eye does. */
function distance(a: [number, number, number], b: [number, number, number]) {
  const rMean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db,
  );
}

export async function estimateDominantColour(
  dataUrl: string,
): Promise<string | undefined> {
  try {
    const img = await loadImage(dataUrl);
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, size, size);

    // Sample the middle of the frame — garment photos put the subject there
    // and the edges are usually background.
    const inset = Math.round(size * 0.22);
    const { data } = ctx.getImageData(inset, inset, size - inset * 2, size - inset * 2);

    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // skip transparent
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    if (!n) return undefined;

    const avg: [number, number, number] = [r / n, g / n, b / n];

    let best: { value: string; d: number } | undefined;
    for (const c of COLOURS) {
      if (!c.hint) continue;
      const d = distance(avg, hexToRgb(c.hint));
      if (!best || d < best.d) best = { value: c.value, d };
    }
    return best?.value;
  } catch {
    return undefined;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
