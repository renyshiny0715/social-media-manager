// GitHub repo as a datastore. Drafts live under data/drafts/, generated
// images under data/images/, and dedupe state in data/state.json.

import { config } from "./config";
import type { Draft, State } from "./types";

const API = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${config.githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function getFile(path: string): Promise<{ content: Buffer; sha: string } | null> {
  const res = await fetch(
    `${API}/repos/${config.githubRepo}/contents/${path}?ref=${config.githubBranch}`,
    { headers: headers(), cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return { content: Buffer.from(json.content, "base64"), sha: json.sha };
}

async function putFile(path: string, content: Buffer, message: string): Promise<void> {
  const existing = await getFile(path);
  const res = await fetch(`${API}/repos/${config.githubRepo}/contents/${path}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: content.toString("base64"),
      branch: config.githubBranch,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
}

async function listDir(path: string): Promise<string[]> {
  const res = await fetch(
    `${API}/repos/${config.githubRepo}/contents/${path}?ref=${config.githubBranch}`,
    { headers: headers(), cache: "no-store" },
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub LIST ${path} failed: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map((f: { name: string }) => f.name);
}

// ---- Drafts ----

export async function saveDraft(draft: Draft): Promise<void> {
  await putFile(
    `data/drafts/${draft.id}.json`,
    Buffer.from(JSON.stringify(draft, null, 2)),
    `draft: ${draft.topic}`,
  );
}

export async function loadDraft(id: string): Promise<Draft | null> {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  const file = await getFile(`data/drafts/${id}.json`);
  if (!file) return null;
  return JSON.parse(file.content.toString("utf8")) as Draft;
}

export async function listDrafts(): Promise<Draft[]> {
  const names = await listDir("data/drafts");
  const drafts = await Promise.all(
    names
      .filter((n) => n.endsWith(".json"))
      .map((n) => loadDraft(n.replace(/\.json$/, ""))),
  );
  return (drafts.filter(Boolean) as Draft[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

// ---- Images ----

export async function saveImage(id: string, png: Buffer): Promise<void> {
  await putFile(`data/images/${id}.png`, png, `image for draft ${id}`);
}

export function rawImageUrl(id: string): string {
  return `https://raw.githubusercontent.com/${config.githubRepo}/${config.githubBranch}/data/images/${id}.png`;
}

export async function loadImage(id: string): Promise<Buffer | null> {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  // Contents API returns base64 for files up to ~1MB; use the raw media type for larger PNGs.
  const res = await fetch(
    `${API}/repos/${config.githubRepo}/contents/data/images/${id}.png?ref=${config.githubBranch}`,
    { headers: { ...headers(), Accept: "application/vnd.github.raw+json" }, cache: "no-store" },
  );
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

// ---- State ----

export async function loadState(): Promise<State> {
  const file = await getFile("data/state.json");
  if (!file) return { usedUrls: [] };
  return JSON.parse(file.content.toString("utf8")) as State;
}

export async function saveState(state: State): Promise<void> {
  // Keep the dedupe list bounded.
  state.usedUrls = state.usedUrls.slice(-300);
  await putFile("data/state.json", Buffer.from(JSON.stringify(state, null, 2)), "update state");
}
