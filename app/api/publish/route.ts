import { NextRequest, NextResponse } from "next/server";
import { loadDraft, saveDraft } from "@/lib/github";
import { verify } from "@/lib/sign";
import { publishToX } from "@/lib/publish/x";
import { publishToLinkedIn } from "@/lib/publish/linkedin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// POST from the review page form. Publishing is POST-only so that email
// link scanners (which prefetch GETs) can never trigger a publish.

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const sig = String(form.get("sig") ?? "");
  const platform = String(form.get("platform") ?? "");
  const text = String(form.get("text") ?? "").trim();

  const back = (query: string) =>
    NextResponse.redirect(new URL(`/publish/${id}?sig=${sig}&${query}`, req.url), 303);

  if (!verify(id, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }
  if (platform !== "linkedin" && platform !== "x") {
    return NextResponse.json({ error: "invalid platform" }, { status: 400 });
  }
  if (!text) return back(`error=${encodeURIComponent("Post text is empty")}`);

  const draft = await loadDraft(id);
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  try {
    if (platform === "x") {
      const { postId } = await publishToX(draft, text);
      draft.xPost = text;
      draft.published.x = { at: new Date().toISOString(), postId };
    } else {
      const { postId } = await publishToLinkedIn(draft, text);
      draft.linkedinPost = text;
      draft.published.linkedin = { at: new Date().toISOString(), postId };
    }
    await saveDraft(draft);
    return back(`done=${platform}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`publish to ${platform} failed:`, err);
    return back(`error=${encodeURIComponent(message.slice(0, 300))}`);
  }
}
