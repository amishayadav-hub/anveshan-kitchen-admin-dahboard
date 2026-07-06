import { isAdminConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// Lightweight, unauthenticated status probe so the dashboard can warn when the
// Admin SDK service account hasn't been configured yet. Returns no secrets.
export async function GET() {
  return Response.json({
    ok: true,
    adminConfigured: isAdminConfigured(),
  });
}
