// Session แบบง่าย สำหรับแอดมินคนเดียว (ไม่มีตาราง user/role แยก)
// Cookie เก็บ "<issuedAt>.<hmacSignature>" เซ็นด้วย ADMIN_SESSION_SECRET
// แยกจาก ADMIN_PASSWORD โดยเจตนา — คีย์ session รั่วไม่เท่ากับรหัสผ่านรั่ว

import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 วัน

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function createAdminSessionToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const issuedAt = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0) return false;
  if (age > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) return false;

  return true;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
