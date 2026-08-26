// Image pipeline, lazy by design: drafts are emailed with a free template-card
// preview, and the real AI illustration (high quality) is generated only at
// publish time — so image spend goes 100% to posts that actually ship.

import { config } from "./config";
import { loadImage, saveImage, saveDraft } from "./github";
import type { Draft } from "./types";

export async function generateAiImage(
  prompt: string,
  quality: "low" | "medium" | "high" = "high",
): Promise<Buffer | null> {
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

Render as a scroll-stopping editorial illustration that doubles as a mini-infographic for a
professional social feed. Magazine-cover quality: strong focal point, confident colors, high
contrast, a touch of humor in the visual storytelling. TYPOGRAPHY RULES: render every headline
and label EXACTLY as spelled in the prompt above — clean bold sans-serif, large and legible at
thumbnail size, high contrast against its background; text is part of the composition, not an
afterthought. Do not add, repeat, or invent any text beyond what the prompt specifies. Never
add watermarks, logos, or stray characters.`,
        size: "1536x1024",
        quality,
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

// Called at publish time: returns the final image bytes for the draft,
// generating + storing the AI illustration on first use. Falls back to the
// template card if generation is unavailable or fails.
export async function ensureAiImage(draft: Draft): Promise<Buffer | null> {
  if (draft.imageType === "ai") {
    const existing = await loadImage(draft.id);
    if (existing) return existing;
  }

  const generated = await generateAiImage(draft.imagePrompt, "high");
  if (generated) {
    await saveImage(draft.id, generated);
    if (draft.imageType !== "ai") {
      draft.imageType = "ai";
      await saveDraft(draft); // persist immediately so a failed publish never re-bills the image
    }
    return generated;
  }

  return imageBytesForDraft(draft.id, "card");
}

// URL of the image to show for a draft (AI PNG in repo, or on-the-fly card).
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
