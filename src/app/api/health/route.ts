import { isAdminConfigured, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// TEMP diagnostic: also probe a Firestore read (with preferRest) so we can
// confirm the gRPC-hang fix works on Vercel without needing an auth token.
export async function GET() {
  const out: Record<string, unknown> = { ok: true, adminConfigured: isAdminConfigured() };
  if (isAdminConfigured()) {
    const started = Date.now();
    try {
      const snap = await getAdminDb().collection("clicks").count().get();
      out.firestore = "ok";
      out.clicksCount = snap.data().count;
      out.readMs = Date.now() - started;
    } catch (e) {
      out.firestore = "FAILED";
      out.firestoreError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      out.readMs = Date.now() - started;
    }
  }
  return Response.json(out);
}
