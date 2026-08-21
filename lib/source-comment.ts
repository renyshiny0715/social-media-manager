import type { Draft } from "./types";

// The reply automatically posted under a published X post, carrying the
// source attribution + link. Returns null for evergreen drafts.
// (LinkedIn's comments API is partner-only, so there the link goes into the
// post body via withSourceLink instead.)
export function sourceComment(draft: Draft): string | null {
  if (!draft.sourceUrl) return null;
  const name = draft.sourceName ? `${draft.sourceName}: ` : "";
  return `🔗 Full article — ${name}${draft.sourceUrl}`;
}

// Ensures the LinkedIn post text ends with the source link (no-op for
// evergreen drafts or when the link is already present).
export function withSourceLink(text: string, draft: Draft): string {
  if (!draft.sourceUrl || text.includes(draft.sourceUrl)) return text;
  return `${text.trimEnd()}\n\n🔗 Full article: ${draft.sourceUrl}`;
}
