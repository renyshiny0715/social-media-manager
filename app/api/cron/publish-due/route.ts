import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { listDrafts, saveDraft } from "@/lib/github";
import { publishToX } from "@/lib/publish/x";
import { publishToLinkedIn } from "@/lib/publish/linkedin";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Publishes any scheduled posts whose time has come. Triggered every 10 minutes
// by the GitHub Actions workflow (.github/workflows/publish-due.yml), so a
// "10pm UK" schedule fires within minutes of 10pm regardless of GMT/BST.

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secretParam = req.nextUrl.searchParams.get("secret");
  const ok =
    config.cronSecret &&
    (auth === `Bearer ${config.cronSecret}` || secretParam === config.cronSecret);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = Date.now();
  const results: string[] = [];

  const drafts = await listDrafts();
  for (const draft of drafts) {
    if (!draft.scheduled) continue;

    for (const platform of ["linkedin", "x"] as const) {
      const when = draft.scheduled[platform];
      if (!when || Date.parse(when) > now) continue;
      if (draft.published[platform]) {
        delete draft.scheduled[platform];
        await saveDraft(draft);
        continue;
      }
      try {
        if (platform === "x") {
          const { postId } = await publishToX(draft, draft.xPost);
          draft.published.x = { at: new Date().toISOString(), postId };
        } else {
          const { postId } = await publishToLinkedIn(draft, draft.linkedinPost);
          draft.published.linkedin = { at: new Date().toISOString(), postId };
        }
        delete draft.scheduled[platform];
        await saveDraft(draft);
        results.push(`published ${draft.id} -> ${platform}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`scheduled publish ${draft.id} -> ${platform} failed:`, err);
        results.push(`FAILED ${draft.id} -> ${platform}: ${message.slice(0, 200)}`);
        // Leave the schedule in place so the next tick retries.
      }
    }
  }

  return NextResponse.json({ ok: true, checked: drafts.length, results });
}
