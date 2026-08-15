import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { verify } from "@/lib/sign";
import { saveLinkedInAuth } from "@/lib/linkedin-token";

export const dynamic = "force-dynamic";

// Step 2 of the LinkedIn OAuth helper: exchanges the code for an access token,
// looks up your person URN, and stores both (encrypted) in the datastore repo.
// Renewing an expired token = just re-run /api/linkedin/auth — nothing to paste.

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !verify("linkedin-oauth", state)) {
    return NextResponse.json({ error: "missing code or bad state" }, { status: 400 });
  }

  const redirectUri = `${config.appUrl}/api/linkedin/callback`;
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.linkedinClientId,
      client_secret: config.linkedinClientSecret,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: `token exchange failed: ${await tokenRes.text()}` },
      { status: 500 },
    );
  }
  const token = await tokenRes.json();

  const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = meRes.ok ? await meRes.json() : {};
  const personUrn = me.sub ? `urn:li:person:${me.sub}` : "";
  const expiresAt = new Date(Date.now() + (token.expires_in ?? 0) * 1000).toISOString();
  const expiresDays = Math.round((token.expires_in ?? 0) / 86400);

  // Store encrypted in the datastore repo so publishing picks it up immediately —
  // no env var edits, no redeploy.
  let stored = false;
  if (personUrn && config.githubToken && config.githubRepo) {
    try {
      await saveLinkedInAuth({ accessToken: token.access_token, personUrn, expiresAt });
      stored = true;
    } catch (err) {
      console.error("failed to store LinkedIn token:", err);
    }
  }

  const html = stored
    ? `<!doctype html><meta charset="utf-8">
  <body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px;">
    <h1>LinkedIn connected ✅</h1>
    <p><b>Nothing else to do</b> — the token was saved automatically (encrypted) and publishing
    will use it right away.</p>
    <p>Valid until <b>${new Date(expiresAt).toDateString()}</b> (~${expiresDays} days).
    You'll get a reminder in the draft emails when it's close to expiring; renewing is just
    visiting <code>/api/linkedin/auth?secret=...</code> again and clicking Allow.</p>
  </body>`
    : `<!doctype html><meta charset="utf-8">
  <body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px;">
    <h1>LinkedIn connected — manual step needed</h1>
    <p>Automatic storage isn't available (GitHub datastore not configured or the userinfo lookup
    failed), so set these environment variables in Vercel and redeploy:</p>
    <p><b>LINKEDIN_ACCESS_TOKEN</b></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all;">${token.access_token}</pre>
    <p><b>LINKEDIN_PERSON_URN</b></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;">${personUrn || "(userinfo lookup failed)"}</pre>
    <p style="color:#a00;">⚠️ This token expires in ~${expiresDays} days.</p>
  </body>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
