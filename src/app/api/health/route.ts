export const runtime = "nodejs";

// Self-diagnosing health probe. It does NOT statically import firebase-admin, so
// this route's own module always loads. It dynamically imports the Admin SDK
// inside a try/catch and reports the real error — so a runtime failure (e.g. a
// module not packaged into the Vercel function) surfaces as JSON instead of a
// 500 HTML page.
export async function GET() {
  const hasEnv = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );

  const diag: Record<string, unknown> = { ok: true, hasServiceAccountEnv: hasEnv };

  try {
    await import("firebase-admin/app");
    await import("firebase-admin/firestore");
    await import("firebase-admin/auth");
    diag.firebaseAdminImport = "ok";
  } catch (e) {
    diag.firebaseAdminImport = "FAILED";
    diag.importError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  try {
    const { isAdminConfigured } = await import("@/lib/firebase-admin");
    diag.adminConfigured = isAdminConfigured();
  } catch (e) {
    diag.adminConfigured = "FAILED";
    diag.libError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  return Response.json(diag);
}
