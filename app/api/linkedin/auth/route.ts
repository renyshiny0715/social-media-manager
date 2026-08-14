import { NextRequest, NextResponse } from "next/server";
import { config, assertConfigured } from "@/lib/config";
import { sign } from "@/lib/sign";

export const dynamic = "force-dynamic";

// Step 1 of the LinkedIn OAuth helper. Visit /api/linkedin/auth?secret=<APP_SECRET>
// to be redirected to LinkedIn's consent screen. The callback prints the access
// token + person URN to paste into your environment variables.

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== config.appSecret || !config.appSecret) {
    return NextResponse.json({ error: "unauthorized — pass ?secret=<APP_SECRET>" }, { status: 401 });
  }
  const missing = assertConfigured(["linkedinClientId", "linkedinClientSecret"]);
  if (missing) return NextResponse.json({ error: missing }, { status: 500 });

  const redirectUri = `${config.appUrl}/api/linkedin/callback`;
  const state = sign("linkedin-oauth");
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.linkedinClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid profile w_member_social");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
