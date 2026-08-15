// Central place for reading environment configuration.
// Every integration degrades gracefully when its keys are missing,
// so the app can be deployed first and wired up key-by-key.

export const config = {
  // OpenAI — drafts the posts (GPT-5) and generates images (gpt-image-1)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5",
  // Set OPENAI_IMAGES=off to skip AI images and always use the template card
  openaiImages: (process.env.OPENAI_IMAGES ?? "on") !== "off",

  // GitHub repo used as the datastore for drafts/images/state
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubRepo: process.env.GITHUB_REPO ?? "", // "owner/name"
  githubBranch: process.env.GITHUB_BRANCH ?? "main",

  // Gmail (App Password) — sends the draft-selection email
  gmailUser: process.env.GMAIL_USER ?? "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  emailTo: process.env.EMAIL_TO ?? process.env.GMAIL_USER ?? "",

  // App
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  appSecret: process.env.APP_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  draftsPerRun: Number(process.env.DRAFTS_PER_RUN ?? "6"),

  // X (Twitter) — OAuth 1.0a user context from the developer portal
  xApiKey: process.env.X_API_KEY ?? "",
  xApiSecret: process.env.X_API_SECRET ?? "",
  xAccessToken: process.env.X_ACCESS_TOKEN ?? "",
  xAccessSecret: process.env.X_ACCESS_SECRET ?? "",

  // LinkedIn
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  linkedinAccessToken: process.env.LINKEDIN_ACCESS_TOKEN ?? "",
  linkedinPersonUrn: process.env.LINKEDIN_PERSON_URN ?? "", // "urn:li:person:xxxx"
};

export function assertConfigured(keys: (keyof typeof config)[]): string | null {
  const missing = keys.filter((k) => !config[k]);
  if (missing.length > 0) return `Missing environment variables: ${missing.join(", ")}`;
  return null;
}
