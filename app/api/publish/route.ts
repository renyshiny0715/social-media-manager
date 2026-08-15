import { NextRequest, NextResponse } from "next/server";
import { loadDraft, saveDraft } from "@/lib/github";
import { verify } from "@/lib/sign";
import { publishToX } from "@/lib/publish/x";
import { publishToLinkedIn } from "@/lib/publish/linkedin";
import { nextLondonPublishTime } from "@/lib/schedule";
import { ensureAiImage } from "@/lib/images";

export const maxDuration = 300; // publish-time image generation can take ~a minute
export const dynamic = "force-dynamic";

// POST from the review page form. Publishing is POST-only so that email
// link scanners (which prefetch GETs) can never trigger a publish.
// mode = "now"     -> publish immediately
// mode = "tonight" -> queue for 10pm UK time (published by /api/cron/publish-due)

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const sig = String(form.get("sig") ?? "");
  const platform = String(form.get("platform") ?? "");
  const mode = String(form.get("mode") ?? "now");
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
    // Persist any last-minute text edits in both modes.
    if (platform === "x") draft.xPost = text;
    else draft.linkedinPost = text;

    if (mode === "tonight") {
      const when = nextLondonPublishTime().toISOString();
      draft.scheduled = { ...draft.scheduled, [platform]: when };
      await saveDraft(draft);
      return back(`scheduled=${platform}`);
    }

    // The premium AI illustration is generated here, at publish time.
    const image = await ensureAiImage(draft);

    if (platform === "x") {
      const { postId, note } = await publishToX(draft, text, image);
      draft.published.x = { at: new Date().toISOString(), postId };
      if (draft.scheduled?.x) delete draft.scheduled.x;
      await saveDraft(draft);
      return back(`done=x${note ? `&note=${encodeURIComponent(note)}` : ""}`);
    } else {
      const { postId } = await publishToLinkedIn(draft, text, image);
      draft.published.linkedin = { at: new Date().toISOString(), postId };
      if (draft.scheduled?.linkedin) delete draft.scheduled.linkedin;
    }
    await saveDraft(draft);
    return back(`done=${platform}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`publish to ${platform} failed:`, err);
    return back(`error=${encodeURIComponent(message.slice(0, 300))}`);
  }
}
