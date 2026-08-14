import { config, assertConfigured } from "../config";
import { imageBytesForDraft } from "../images";
import type { Draft } from "../types";

const LI_VERSION = "202506";

function liHeaders() {
  return {
    Authorization: `Bearer ${config.linkedinAccessToken}`,
    "LinkedIn-Version": LI_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

// LinkedIn "little text" format: these characters must be escaped in commentary.
function escapeCommentary(text: string): string {
  return text.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);
}

async function uploadImage(imageBytes: Buffer): Promise<string> {
  const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: liHeaders(),
    body: JSON.stringify({
      initializeUploadRequest: { owner: config.linkedinPersonUrn },
    }),
  });
  if (!init.ok) {
    throw new Error(`LinkedIn image init failed: ${init.status} ${await init.text()}`);
  }
  const { value } = await init.json();

  const put = await fetch(value.uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.linkedinAccessToken}`,
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
): Promise<{ postId: string }> {
  const missing = assertConfigured(["linkedinAccessToken", "linkedinPersonUrn"]);
  if (missing) {
    throw new Error(
      `LinkedIn is not configured. ${missing}. Run the OAuth helper at /api/linkedin/auth to obtain a token.`,
    );
  }

  const image = await imageBytesForDraft(draft.id, draft.imageType);
  let imageUrn: string | null = null;
  if (image) {
    imageUrn = await uploadImage(image);
  }

  const body: Record<string, unknown> = {
    author: config.linkedinPersonUrn,
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
    headers: liHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn post failed: ${res.status} ${await res.text()}`);
  }
  const postId = res.headers.get("x-restli-id") ?? "";
  return { postId };
}
