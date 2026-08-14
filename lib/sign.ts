import { createHmac, timingSafeEqual } from "crypto";
import { config } from "./config";

export function sign(value: string): string {
  return createHmac("sha256", config.appSecret).update(value).digest("hex");
}

export function verify(value: string, signature: string | null | undefined): boolean {
  if (!signature || !config.appSecret) return false;
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}
