import { NextRequest, NextResponse } from "next/server";
import { config, assertConfigured } from "@/lib/config";
import { fetchFreshArticles } from "@/lib/rss";
import { generateDrafts, toDraft } from "@/lib/generate";
import { generateAiImage } from "@/lib/images";
import { saveDraft, saveImage, loadState, saveState } from "@/lib/github";
import { sendDraftEmail } from "@/lib/email";
import type { Draft } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Triggered by Vercel Cron (Mon/Wed/Fri, see vercel.json) or manually:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/generate

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secretParam = req.nextUrl.searchParams.get("secret");
  const ok =
    config.cronSecret &&
    (auth === `Bearer ${config.cronSecret}` || secretParam === config.cronSecret);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const missing = assertConfigured([
    "openaiApiKey",
    "githubToken",
    "githubRepo",
    "gmailUser",
    "gmailAppPassword",
    "appSecret",
  ]);
  if (missing) return NextResponse.json({ error: missing }, { status: 500 });

  const log: string[] = [];
  try {
    // 1. What have we already covered?
    const state = await loadState();
    const used = new Set(state.usedUrls);

    // 2. Fresh articles from reputable sources.
    const articles = await fetchFreshArticles(used);
    log.push(`fetched ${articles.length} fresh articles`);

    // 3. Claude drafts the posts.
    const generated = await generateDrafts(articles);
    log.push(`generated ${generated.length} drafts`);

    // 4. Images: AI first (if configured), template card as fallback.
    const drafts: Draft[] = [];
    for (const g of generated) {
      const aiImage = await generateAiImage(g.image_prompt);
      const draft = toDraft(g, aiImage ? "ai" : "card");
      if (aiImage) await saveImage(draft.id, aiImage);
      await saveDraft(draft);
      drafts.push(draft);
      if (g.source_url) used.add(g.source_url);
    }
    log.push(`saved ${drafts.length} drafts (${drafts.filter((d) => d.imageType === "ai").length} with AI images)`);

    // 5. Remember which articles were used.
    await saveState({ usedUrls: [...used], lastRunAt: new Date().toISOString() });

    // 6. Email the drafts for one-click review & publish.
    await sendDraftEmail(drafts);
    log.push(`emailed ${config.emailTo}`);

    return NextResponse.json({ ok: true, log, draftIds: drafts.map((d) => d.id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("cron/generate failed:", err);
    return NextResponse.json({ ok: false, log, error: message }, { status: 500 });
  }
}
