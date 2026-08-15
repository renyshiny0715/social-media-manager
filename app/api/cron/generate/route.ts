import { NextRequest, NextResponse } from "next/server";
import { config, assertConfigured } from "@/lib/config";
import { fetchFreshArticles } from "@/lib/rss";
import { generateDrafts, toDraft } from "@/lib/generate";
import { saveDraft, loadState, saveState } from "@/lib/github";
import { sendDraftEmail } from "@/lib/email";
import { loadLinkedInAuth, daysUntilExpiry, renewalUrl } from "@/lib/linkedin-token";
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

    // 4. Save drafts with free template-card previews. The real AI illustration
    //    is generated lazily at publish time (high quality, only for posts that ship).
    const drafts: Draft[] = [];
    for (const g of generated) {
      const draft = toDraft(g, "card");
      await saveDraft(draft);
      drafts.push(draft);
      if (g.source_url) used.add(g.source_url);
    }
    log.push(`saved ${drafts.length} drafts (AI images deferred to publish time)`);

    // 5. Remember which articles were used.
    await saveState({ usedUrls: [...used], lastRunAt: new Date().toISOString() });

    // 6. Email the drafts for one-click review & publish, with token-expiry warnings.
    const warnings: string[] = [];
    try {
      const liAuth = await loadLinkedInAuth();
      if (liAuth) {
        const days = daysUntilExpiry(liAuth);
        if (days !== null && days <= 14) {
          warnings.push(
            days < 0
              ? `Your LinkedIn token has EXPIRED — renew it in one click: <a href="${renewalUrl()}">re-authorize LinkedIn</a>`
              : `Your LinkedIn token expires in ${days} day${days === 1 ? "" : "s"} — renew it in one click: <a href="${renewalUrl()}">re-authorize LinkedIn</a>`,
          );
        }
      }
    } catch {
      // never block the email over a warning check
    }
    await sendDraftEmail(drafts, warnings);
    log.push(`emailed ${config.emailTo}`);

    return NextResponse.json({ ok: true, log, draftIds: drafts.map((d) => d.id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("cron/generate failed:", err);
    return NextResponse.json({ ok: false, log, error: message }, { status: 500 });
  }
}
