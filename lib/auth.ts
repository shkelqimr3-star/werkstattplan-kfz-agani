import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const COOKIE_NAME = "werkstattplan_session";
const SECRET = process.env.AUTH_SECRET || "werkstattplan-local-dev-secret-change-me";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MECHANIC" | "RECEPTION";
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function signSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSession(value?: string | null): SessionUser | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };
