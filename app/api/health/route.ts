import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { TwitterApi } from "twitter-api-v2";
import { config } from "@/lib/config";
import { loadLinkedInAuth, daysUntilExpiry } from "@/lib/linkedin-token";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Live health check of every integration + token expirations.
//   GET /api/health?secret=<APP_SECRET or CRON_SECRET>

type Check = { ok: boolean; detail: string };

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || (secret !== config.appSecret && secret !== config.cronSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const checks: Record<string, Check> = {};

  // OpenAI (drafting + images) — key never expires
  if (!config.openaiApiKey) {
    checks.openai = { ok: false, detail: "OPENAI_API_KEY not set" };
  } else {
    try {
      const r = await fetch("https://api.openai.com/v1/models?limit=1", {
        headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      });
      checks.openai = r.ok
        ? { ok: true, detail: "key valid (never expires)" }
        : { ok: false, detail: `API returned ${r.status}` };
    } catch (e) {
      checks.openai = { ok: false, detail: String(e) };
    }
  }

  // GitHub datastore — fine-grained tokens expire; the API reports when
  if (!config.githubToken || !config.githubRepo) {
    checks.github = { ok: false, detail: "GITHUB_TOKEN / GITHUB_REPO not set" };
  } else {
    try {
      const r = await fetch(`https://api.github.com/repos/${config.githubRepo}`, {
        headers: {
          Authorization: `Bearer ${config.githubToken}`,
          Accept: "application/vnd.github+json",
        },
      });
      const exp = r.headers.get("github-authentication-token-expiration");
      checks.github = r.ok
        ? { ok: true, detail: exp ? `token valid, expires ${exp}` : "token valid (no expiration)" }
        : { ok: false, detail: `API returned ${r.status}` };
    } catch (e) {
      checks.github = { ok: false, detail: String(e) };
    }
  }

  // Gmail — app password never expires
  if (!config.gmailUser || !config.gmailAppPassword) {
    checks.gmail = { ok: false, detail: "GMAIL_USER / GMAIL_APP_PASSWORD not set" };
  } else {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: config.gmailUser, pass: config.gmailAppPassword },
      });
      await transporter.verify();
      checks.gmail = { ok: true, detail: "SMTP login OK (app password never expires)" };
    } catch (e) {
      checks.gmail = { ok: false, detail: String(e).slice(0, 200) };
    }
  }

  // X — OAuth 1.0a user tokens never expire
  if (!config.xApiKey || !config.xAccessToken) {
    checks.x = { ok: false, detail: "X_* keys not set" };
  } else {
    try {
      const client = new TwitterApi({
        appKey: config.xApiKey,
        appSecret: config.xApiSecret,
        accessToken: config.xAccessToken,
        accessSecret: config.xAccessSecret,
      });
      const me = await client.v2.me();
      checks.x = { ok: true, detail: `authenticated as @${me.data.username} (tokens never expire)` };
    } catch (e) {
      checks.x = { ok: false, detail: String(e).slice(0, 200) };
    }
  }

  // LinkedIn — ~60-day token; stored copy preferred over env var
  const liAuth = await loadLinkedInAuth().catch(() => null);
  if (!liAuth) {
    checks.linkedin = { ok: false, detail: "not connected — run /api/linkedin/auth" };
  } else {
    try {
      const r = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${liAuth.accessToken}` },
      });
      const days = daysUntilExpiry(liAuth);
      const expiry =
        days === null
          ? "expiry unknown (env-var token)"
          : days < 0
            ? "EXPIRED"
            : `expires in ${days} days`;
      checks.linkedin = r.ok
        ? { ok: true, detail: `token valid for ${liAuth.personUrn}, ${expiry}` }
        : { ok: false, detail: `token rejected (${r.status}) — renew at /api/linkedin/auth` };
    } catch (e) {
      checks.linkedin = { ok: false, detail: String(e).slice(0, 200) };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 207 });
}
