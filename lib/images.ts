// Image pipeline: try OpenAI image generation when a key is configured;
// otherwise (or on failure) fall back to the template card rendered by /api/card.

import { config } from "./config";

export async function generateAiImage(prompt: string): Promise<Buffer | null> {
  if (!config.openaiApiKey || !config.openaiImages) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `${prompt}

Render as a premium, scroll-stopping editorial illustration for a professional social feed:
polished and gallery-quality, sharp focus, high contrast, rich color depth, subtle texture
and depth of field. Absolutely no text, letters, numbers, watermarks, or logos anywhere.`,
        size: "1536x1024",
        quality: "high",
        n: 1,
      }),
    });
    if (!res.ok) {
      console.error("OpenAI image generation failed:", res.status, await res.text());
      return null;
    }
    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) return null;
    return Buffer.from(b64, "base64");
  } catch (err) {
    console.error("OpenAI image generation error:", err);
    return null;
  }
}

// URL of the image to show/publish for a draft (AI PNG in repo, or on-the-fly card).
export function imageUrlForDraft(draftId: string, imageType: "ai" | "card"): string {
  if (imageType === "ai") {
    return `https://raw.githubusercontent.com/${config.githubRepo}/${config.githubBranch}/data/images/${draftId}.png`;
  }
  return `${config.appUrl}/api/card?id=${draftId}`;
}

// PNG bytes for publishing (fetches either the repo image or the rendered card).
export async function imageBytesForDraft(
  draftId: string,
  imageType: "ai" | "card",
): Promise<Buffer | null> {
  try {
    const res = await fetch(imageUrlForDraft(draftId, imageType), { cache: "no-store" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
