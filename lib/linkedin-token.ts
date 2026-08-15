// LinkedIn tokens expire (~60 days) and standard apps get no refresh token,
// so renewal means re-running OAuth. To make that a one-click affair, the
// callback stores the fresh token AES-encrypted in the datastore repo; the
// publisher prefers that copy over the LINKEDIN_ACCESS_TOKEN env var, so a
// renewal needs no Vercel edits and no redeploy.

import { config } from "./config";
import { encryptJson, decryptJson } from "./crypto";
import { getFile, putFile } from "./github";

const TOKEN_PATH = "data/secrets/linkedin.enc";

export interface LinkedInAuth {
  accessToken: string;
  personUrn: string;
  expiresAt: string; // ISO; "" when unknown (env-var fallback)
}

export async function saveLinkedInAuth(auth: LinkedInAuth): Promise<void> {
  await putFile(TOKEN_PATH, Buffer.from(encryptJson(auth)), "refresh linkedin token");
}

export async function loadLinkedInAuth(): Promise<LinkedInAuth | null> {
  // Repo-stored token first (always the freshest after a renewal).
  try {
    const file = await getFile(TOKEN_PATH);
    if (file) {
      const auth = decryptJson<LinkedInAuth>(file.content.toString("utf8"));
      if (auth.accessToken && auth.personUrn) return auth;
    }
  } catch (err) {
    console.error("failed to load stored LinkedIn token, falling back to env:", err);
  }
  if (config.linkedinAccessToken && config.linkedinPersonUrn) {
    return {
      accessToken: config.linkedinAccessToken,
      personUrn: config.linkedinPersonUrn,
      expiresAt: "",
    };
  }
  return null;
}

export function daysUntilExpiry(auth: LinkedInAuth): number | null {
  if (!auth.expiresAt) return null;
  return Math.floor((Date.parse(auth.expiresAt) - Date.now()) / 86_400_000);
}

export function renewalUrl(): string {
  return `${config.appUrl}/api/linkedin/auth?secret=${config.appSecret}`;
}
