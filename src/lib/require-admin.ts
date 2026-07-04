import "server-only";
import { adminAuth } from "./firebase-admin";

// Comma-separated allowlist fallback (e.g. ADMIN_EMAILS="a@x.com,b@y.com").
// Primary gate is the `admin` custom claim; this allowlist lets you bootstrap
// without setting a claim first.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export interface AdminUser {
  uid: string;
  email: string | null;
}

export type AdminCheck =
  | { ok: true; user: AdminUser }
  | { ok: false; status: number; error: string };

/**
 * Verifies the Firebase ID token from the Authorization: Bearer header and
 * confirms the caller is an admin (custom claim `admin === true`, or email in
 * the ADMIN_EMAILS allowlist). Use at the top of every privileged API route.
 */
export async function requireAdmin(req: Request): Promise<AdminCheck> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "Missing bearer token" };

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email ?? null;
    const isAdmin =
      decoded.admin === true ||
      (email !== null && ADMIN_EMAILS.includes(email.toLowerCase()));
    if (!isAdmin) return { ok: false, status: 403, error: "Not authorized" };
    return { ok: true, user: { uid: decoded.uid, email } };
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }
}
