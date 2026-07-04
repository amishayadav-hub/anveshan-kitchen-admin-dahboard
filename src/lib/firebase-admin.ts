import "server-only";
import {
  getApps,
  initializeApp,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Loads the service-account credential. Supports either:
//  - FIREBASE_SERVICE_ACCOUNT = the raw JSON, or a base64-encoded JSON blob
//  - GOOGLE_APPLICATION_CREDENTIALS = path to the JSON file (applicationDefault)
// The service account is a SERVER-ONLY secret — never expose it to the client.
function loadCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    return cert(JSON.parse(json));
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS on disk.
  return applicationDefault();
}

const app: App = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: loadCredential(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
