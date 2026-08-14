import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { verify } from "@/lib/sign";

export const dynamic = "force-dynamic";

// Step 2 of the LinkedIn OAuth helper: exchanges the code for an access token,
// looks up your person URN, and shows both so you can set them as env vars.

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
  const personUrn = me.sub ? `urn:li:person:${me.sub}` : "(userinfo lookup failed)";
  const expiresDays = Math.round((token.expires_in ?? 0) / 86400);

  const html = `<!doctype html><meta charset="utf-8">
  <body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px;">
    <h1>LinkedIn connected ✅</h1>
    <p>Set these two environment variables in Vercel (Project → Settings → Environment Variables), then redeploy:</p>
    <p><b>LINKEDIN_ACCESS_TOKEN</b></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all;">${token.access_token}</pre>
    <p><b>LINKEDIN_PERSON_URN</b></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;">${personUrn}</pre>
    <p style="color:#a00;">⚠️ This token expires in ~${expiresDays} days. When LinkedIn publishing starts failing, revisit
    <code>/api/linkedin/auth?secret=...</code> to mint a new one.</p>
    <p style="color:#888;font-size:13px;">Close this tab after copying — the token is shown only here and is not stored anywhere.</p>
  </body>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
