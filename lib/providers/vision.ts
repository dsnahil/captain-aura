import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* ============================================================================
   AppearanceVisionProvider

   Scope is deliberately narrow: garment attributes and coarse, self-reported-
   style grooming descriptors only. We never infer race, ethnicity, health,
   sexuality, religion, politics or medical conditions, and we never claim
   precise facial measurements.
   ========================================================================== */

export type GarmentAnalysis = {
  category?: string;
  colour?: string;
  material?: string;
  formality?: string;
  suggestedName?: string;
  /** Always true for the mock; the UI asks the user to confirm regardless. */
  requiresConfirmation: boolean;
  confidence: number;
  note?: string;
};

export interface AppearanceVisionProvider {
  readonly name: string;
  readonly isMock: boolean;
  analyzeGarment(imageDataUrl: string): Promise<GarmentAnalysis>;
}

/**
 * Mock: returns nothing it cannot actually know. The closet UI pairs this with
 * genuine client-side dominant-colour extraction, so the user still gets a
 * useful pre-fill without us pretending to recognise the garment.
 */
export class MockVisionProvider implements AppearanceVisionProvider {
  readonly name = "mock-vision";
  readonly isMock = true;

  async analyzeGarment(): Promise<GarmentAnalysis> {
    return {
      requiresConfirmation: true,
      confidence: 0,
      note: "Image recognition isn't configured, so the category is up to you. Colour was estimated from the photo on your device.",
    };
  }
}

const CATEGORIES = [
  "tshirts", "shirts", "sweaters", "hoodies", "jackets",
  "pants", "shorts", "shoes", "accessories",
];
const COLOURS = [
  "black", "charcoal", "grey", "white", "cream", "beige", "brown", "tan",
  "olive", "green", "navy", "blue", "burgundy", "red", "orange", "yellow",
  "pink", "purple",
];

/** Real vision, only when an API key is configured. */
export class AnthropicVisionProvider implements AppearanceVisionProvider {
  readonly name = "anthropic-vision";
  readonly isMock = false;

  constructor(private client: Anthropic) {}

  async analyzeGarment(imageDataUrl: string): Promise<GarmentAnalysis> {
    const match = imageDataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
    if (!match) throw new Error("Unsupported image format");
    const [, mediaType, data] = match;

    const res = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: 400,
      system:
        "You identify clothing items for a personal wardrobe app. Describe only the garment. " +
        "Never describe or infer anything about a person who may appear in the image. " +
        "Respond with JSON only.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as "image/png", data } },
            {
              type: "text",
              text:
                `Identify this clothing item. Respond with JSON: {"category": one of ${CATEGORIES.join("|")}, ` +
                `"colour": one of ${COLOURS.join("|")}, "material": string, ` +
                `"formality": one of very-casual|casual|smart-casual|business|formal, ` +
                `"suggestedName": short name like "Olive relaxed hiking pants", "confidence": 0-1}`,
            },
          ],
        },
      ],
    });

    const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
    const json = JSON.parse(text.replace(/```json?|```/g, "").trim());

    return {
      category: CATEGORIES.includes(json.category) ? json.category : undefined,
      colour: COLOURS.includes(json.colour) ? json.colour : undefined,
      material: json.material,
      formality: json.formality,
      suggestedName: json.suggestedName,
      requiresConfirmation: true,
      confidence: Number(json.confidence ?? 0.5),
    };
  }
}

/** Real garment recognition via Gemini, when a Google AI key is configured. */
export class GeminiVisionProvider implements AppearanceVisionProvider {
  readonly name = "gemini-vision";
  readonly isMock = false;

  constructor(
    private apiKey: string,
    private model = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
  ) {}

  async analyzeGarment(imageDataUrl: string): Promise<GarmentAnalysis> {
    const match = imageDataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
    if (!match) throw new Error("Unsupported image format");
    const [, mimeType, data] = match;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You identify clothing items for a personal wardrobe app. Describe only the garment. " +
                  "Never describe or infer anything about a person who may appear in the image.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data } },
                { text: "Identify this clothing item." },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                category: { type: "STRING", enum: CATEGORIES },
                colour: { type: "STRING", enum: COLOURS },
                material: { type: "STRING" },
                formality: {
                  type: "STRING",
                  enum: ["very-casual", "casual", "smart-casual", "business", "formal"],
                },
                suggestedName: { type: "STRING" },
                confidence: { type: "NUMBER" },
              },
              required: ["category", "colour", "suggestedName", "confidence"],
            },
          },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );

    if (!res.ok) throw new Error(`gemini vision ${res.status}`);

    const payload = await res.json();
    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("");
    if (!text) throw new Error("gemini vision returned nothing");

    const json = JSON.parse(text.replace(/```json?|```/g, "").trim());

    return {
      category: CATEGORIES.includes(json.category) ? json.category : undefined,
      colour: COLOURS.includes(json.colour) ? json.colour : undefined,
      material: json.material,
      formality: json.formality,
      suggestedName: json.suggestedName,
      // The user confirms regardless of how confident the model is.
      requiresConfirmation: true,
      confidence: Number(json.confidence ?? 0.5),
    };
  }
}

export function getVisionProvider(): AppearanceVisionProvider {
  if (process.env.VISION_PROVIDER === "mock") return new MockVisionProvider();

  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) return new GeminiVisionProvider(gemini);

  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) return new AnthropicVisionProvider(new Anthropic({ apiKey: anthropic }));

  return new MockVisionProvider();
}
