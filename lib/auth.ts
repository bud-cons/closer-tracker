import crypto from "crypto";

export const SESSION_COOKIE = "session";

export function getSessionToken(): string {
  const password = process.env.SITE_PASSWORD ?? "";
  const secret = process.env.SESSION_SECRET ?? "";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.SITE_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
