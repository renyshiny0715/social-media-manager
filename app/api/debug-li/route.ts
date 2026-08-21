import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { loadDraft } from "@/lib/github";
import { loadLinkedInAuth } from "@/lib/linkedin-token";
import { sourceComment } from "@/lib/source-comment";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Temporary diagnostic: retries the source-link comment for a published draft
// and returns LinkedIn's raw response.
//   GET /api/debug-li?secret=...&draft=<id>

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || (secret !== config.appSecret && secret !== config.cronSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const draftId = req.nextUrl.searchParams.get("draft") ?? "";
  const draft = await loadDraft(draftId);
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  const postUrn = draft.published.linkedin?.postId;
  const comment = sourceComment(draft);
  if (!postUrn || !comment) {
    return NextResponse.json({ error: "draft has no linkedin postId or no source", postUrn, comment });
  }

  const auth = await loadLinkedInAuth();
  if (!auth) return NextResponse.json({ error: "linkedin not connected" });

  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "LinkedIn-Version": "202606",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actor: auth.personUrn, message: { text: comment } }),
    },
  );
  const body = await res.text();
  return NextResponse.json({
    postUrn,
    comment,
    status: res.status,
    body: body.slice(0, 800),
  });
}
