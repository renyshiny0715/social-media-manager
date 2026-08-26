import { NextRequest, NextResponse } from "next/server";
import { loadDraft } from "@/lib/github";
import { verify } from "@/lib/sign";
import { ensureAiImage } from "@/lib/images";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Generates the AI illustration for a draft ahead of publishing, so it can be
// reviewed on the publish page. Publishing later reuses the stored image, so
// this never double-bills.

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const sig = String(form.get("sig") ?? "");

  if (!verify(id, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }
  const draft = await loadDraft(id);
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  const back = (query: string) =>
    NextResponse.redirect(new URL(`/publish/${id}?sig=${sig}&${query}`, req.url), 303);

  try {
    await ensureAiImage(draft);
    if (draft.imageType !== "ai") {
      return back(`error=${encodeURIComponent("Image generation failed — check OPENAI_API_KEY / Vercel logs")}`);
    }
    return back("previewed=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("preview-image failed:", err);
    return back(`error=${encodeURIComponent(message.slice(0, 300))}`);
  }
}
