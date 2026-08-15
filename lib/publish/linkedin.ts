import { imageBytesForDraft } from "../images";
import { loadLinkedInAuth, renewalUrl, type LinkedInAuth } from "../linkedin-token";
import type { Draft } from "../types";

// LinkedIn versioned-API month (YYYYMM). Versions stay active ~12 months;
// bump this if you ever see 426 NONEXISTENT_VERSION.
const LI_VERSION = "202606";

function liHeaders(auth: LinkedInAuth) {
  return {
    Authorization: `Bearer ${auth.accessToken}`,
    "LinkedIn-Version": LI_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

// LinkedIn "little text" format: these characters must be escaped in commentary.
function escapeCommentary(text: string): string {
  return text.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);
}

async function uploadImage(auth: LinkedInAuth, imageBytes: Buffer): Promise<string> {
  const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: liHeaders(auth),
    body: JSON.stringify({
      initializeUploadRequest: { owner: auth.personUrn },
    }),
  });
  if (!init.ok) {
    throw new Error(`LinkedIn image init failed: ${init.status} ${await init.text()}`);
  }
  const { value } = await init.json();

  const put = await fetch(value.uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(imageBytes),
  });
  if (!put.ok) throw new Error(`LinkedIn image upload failed: ${put.status}`);

  return value.image as string; // urn:li:image:...
}

export async function publishToLinkedIn(
  draft: Draft,
  text: string,
  imageOverride?: Buffer | null,
): Promise<{ postId: string }> {
  const auth = await loadLinkedInAuth();
  if (!auth) {
    throw new Error(
      "LinkedIn is not connected. Set LINKEDIN_CLIENT_ID/SECRET and run the OAuth helper at /api/linkedin/auth.",
    );
  }

  const image = imageOverride ?? (await imageBytesForDraft(draft.id, draft.imageType));
  let imageUrn: string | null = null;
  if (image) {
    imageUrn = await uploadImage(auth, image);
  }

  const body: Record<string, unknown> = {
    author: auth.personUrn,
    commentary: escapeCommentary(text),
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  if (imageUrn) {
    body.content = { media: { id: imageUrn, altText: draft.cardHeadline } };
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: liHeaders(auth),
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    throw new Error(
      `LinkedIn token expired or revoked. Renew it in one click: ${renewalUrl()}`,
    );
  }
  if (!res.ok) {
    throw new Error(`LinkedIn post failed: ${res.status} ${await res.text()}`);
  }
  const postId = res.headers.get("x-restli-id") ?? "";
  return { postId };
}
