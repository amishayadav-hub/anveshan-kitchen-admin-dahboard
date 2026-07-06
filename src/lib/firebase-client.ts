import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Client Firebase — used ONLY for admin login (getting an ID token). All
// privileged reads/writes go through the admin /api/* routes (Admin SDK).
// Same Firebase project as anveshan-recipes, so admin users are the same users.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: if the public Firebase config isn't present (e.g. env vars not set
// during a build/prerender), DON'T call initializeApp — it throws
// `auth/invalid-api-key` and crashes static prerendering (e.g. /_not-found).
// `auth` stays null until configured; the UI handles that gracefully.
let auth: Auth | null = null;
if (firebaseConfig.apiKey) {
  const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

export { auth };
