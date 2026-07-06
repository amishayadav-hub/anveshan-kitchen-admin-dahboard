// One-off bootstrap: grant (or revoke) the Firebase `admin` custom claim.
//
// Usage:
//   node scripts/set-admin-claim.mjs <email-or-uid> [--revoke]
//
// Requires a service-account credential, same as the app:
//   FIREBASE_SERVICE_ACCOUNT  = raw JSON or base64 JSON, OR
//   GOOGLE_APPLICATION_CREDENTIALS = path to the JSON file
//
// After granting, the user must get a fresh ID token (the AuthProvider
// force-refreshes on next load) for the claim to take effect.

import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

// Auto-load .env.local so `node scripts/set-admin-claim.mjs` works without
// manually exporting the credential.
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* no .env.local — rely on the ambient environment */
}

function loadCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    return cert(JSON.parse(json));
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) return cert(JSON.parse(readFileSync(path, "utf8")));
  return applicationDefault();
}

const target = process.argv[2];
const revoke = process.argv.includes("--revoke");
if (!target) {
  console.error("Usage: node scripts/set-admin-claim.mjs <email-or-uid> [--revoke]");
  process.exit(1);
}

initializeApp({ credential: loadCredential() });
const auth = getAuth();

const user = target.includes("@")
  ? await auth.getUserByEmail(target)
  : await auth.getUser(target);

await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true });
console.log(
  `${revoke ? "Revoked" : "Granted"} admin for ${user.email || user.uid} (uid: ${user.uid}).`
);
console.log("The user must obtain a fresh ID token for this to take effect.");
process.exit(0);
