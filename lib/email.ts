import nodemailer from "nodemailer";
import { config } from "./config";
import { sign } from "./sign";
import { imageUrlForDraft } from "./images";
import type { Draft } from "./types";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function draftBlock(draft: Draft, index: number): string {
  const reviewUrl = `${config.appUrl}/publish/${draft.id}?sig=${sign(draft.id)}`;
  const imgUrl = imageUrlForDraft(draft.id, draft.imageType);
  return `
  <div style="border:1px solid #e2e2e2;border-radius:12px;padding:24px;margin:24px 0;background:#ffffff;">
    <div style="font-size:12px;letter-spacing:1px;color:#888;text-transform:uppercase;">Draft ${index + 1}</div>
    <h2 style="margin:8px 0 4px;font-size:20px;color:#111;">${esc(draft.topic)}</h2>
    <p style="margin:0 0 12px;color:#555;font-style:italic;">${esc(draft.angle)}</p>
    ${
      draft.sourceUrl
        ? `<p style="margin:0 0 16px;font-size:13px;color:#777;">
             📰 <b style="color:#444;">${esc(draft.sourceName || domainOf(draft.sourceUrl))}</b>
             &nbsp;·&nbsp; <a href="${draft.sourceUrl}">${esc(draft.sourceTitle)}</a>
             &nbsp;<span style="color:#aaa;">(${domainOf(draft.sourceUrl)})</span></p>`
        : `<p style="margin:0 0 16px;font-size:13px;color:#777;">💡 Evergreen topic (no external source)</p>`
    }
    <img src="${imgUrl}" alt="post image" style="width:100%;max-width:520px;border-radius:8px;margin-bottom:4px;" />
    <div style="font-size:12px;color:#999;margin-bottom:16px;">Preview card — a premium AI illustration is generated when you hit publish.</div>
    <div style="background:#f4f7fb;border-radius:8px;padding:14px;margin-bottom:12px;">
      <div style="font-weight:bold;color:#0a66c2;margin-bottom:6px;">LinkedIn</div>
      <div style="font-size:14px;color:#222;line-height:1.5;">${esc(draft.linkedinPost)}</div>
    </div>
    <div style="background:#f5f5f5;border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-weight:bold;color:#111;margin-bottom:6px;">X</div>
      <div style="font-size:14px;color:#222;line-height:1.5;">${esc(draft.xPost)}</div>
    </div>
    <a href="${reviewUrl}"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">
      Review &amp; Publish →
    </a>
  </div>`;
}

export async function sendDraftEmail(drafts: Draft[], warnings: string[] = []): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.gmailUser, pass: config.gmailAppPassword },
  });

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fafafa;padding:24px;">
    <h1 style="font-size:22px;color:#111;">Your post drafts — ${date}</h1>
    ${warnings
      .map(
        (w) =>
          `<p style="background:#fff3cd;border:1px solid #ffe08a;padding:12px;border-radius:8px;color:#7a5b00;">⚠️ ${w}</p>`,
      )
      .join("")}
    <p style="color:#555;">Pick a draft, review it, and publish with one click. You can edit the text on the review page before it goes out.</p>
    ${drafts.map((d, i) => draftBlock(d, i)).join("")}
    <p style="font-size:12px;color:#999;margin-top:24px;">
      Sent by your Social Media Manager · <a href="${config.appUrl}">dashboard</a>
    </p>
  </div>`;

  await transporter.sendMail({
    from: `"Social Media Manager" <${config.gmailUser}>`,
    to: config.emailTo,
    subject: `🚀 ${drafts.length} posts ready to ship — “${drafts[0]?.topic ?? "new drafts"}” & more`,
    html,
  });
}
