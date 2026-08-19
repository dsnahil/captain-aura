import { NextResponse } from "next/server";
import { z } from "zod";
import { getVisionProvider } from "@/lib/providers/vision";

export const runtime = "nodejs";

const BodySchema = z.object({
  // ~4MB of base64. The client downscales before sending.
  image: z.string().min(32).max(6_000_000),
});

/**
 * Garment analysis for closet uploads. Returns a mock (no guesses) unless a
 * vision-capable API key is configured — the client always asks the user to
 * confirm either way.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
  }

  const provider = getVisionProvider();
  try {
    const analysis = await provider.analyzeGarment(body.image);
    return NextResponse.json({ analysis, provider: provider.name, isMock: provider.isMock });
  } catch {
    return NextResponse.json({
      analysis: {
        requiresConfirmation: true,
        confidence: 0,
        note: "I couldn't analyse that image. Fill in the details yourself and it'll work exactly the same.",
      },
      provider: provider.name,
      isMock: provider.isMock,
    });
  }
}
