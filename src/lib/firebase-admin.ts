import "server-only";
import {
  getApps,
  initializeApp,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// True when a service-account credential is present in the environment. Lets
// routes report a clear "not configured" error instead of crashing at import.
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}

// Loads the service-account credential. Supports either:
//  - FIREBASE_SERVICE_ACCOUNT = raw JSON, or a base64-encoded JSON blob
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
  return applicationDefault();
}

// Lazy singleton so importing this module never throws when the credential is
// missing — only calling getAdminDb()/getAdminAuth() will surface the error.
let cached: App | null = null;
function getApp(): App {
  if (cached) return cached;
  cached = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: loadCredential(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
  return cached;
}

// Cache the Firestore instance and force REST transport. firebase-admin's
// default gRPC transport frequently hangs inside Vercel serverless functions
// (the request never resolves → the function times out → an empty response →
// "Unexpected end of JSON input" on the client). preferRest uses plain HTTP,
// which works reliably in serverless. settings() may only be called once, so we
// cache the instance.
let cachedDb: Firestore | null = null;
export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;
  const db = getFirestore(getApp());
  try {
    db.settings({ preferRest: true });
  } catch {
    // already initialized/used — ignore
  }
  cachedDb = db;
  return cachedDb;
}

export function getAdminAuth(): Auth {
  return getAuth(getApp());
}
