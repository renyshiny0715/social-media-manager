import type { Draft } from "./types";

// The comment automatically posted under a published post, carrying the
// source attribution + link. Returns null for evergreen drafts.
export function sourceComment(draft: Draft): string | null {
  if (!draft.sourceUrl) return null;
  const name = draft.sourceName ? `${draft.sourceName}: ` : "";
  return `🔗 Full article — ${name}${draft.sourceUrl}`;
}
