// AES-256-GCM encryption keyed off APP_SECRET, used to store the LinkedIn
// token in the (public) datastore repo without exposing it.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { config } from "./config";

function key(): Buffer {
  return createHash("sha256").update(config.appSecret).digest();
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function decryptJson<T>(blob: string): T {
  const raw = Buffer.from(blob.trim(), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}
