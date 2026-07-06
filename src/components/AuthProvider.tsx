"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface AuthContextValue {
  user: User | null;
  /** True until the first auth-state check resolves — avoids a login/dashboard flash. */
  loading: boolean;
  /** True when the signed-in user carries the `admin` custom claim. */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  /** fetch() wrapper that attaches the current user's Firebase ID token. */
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // No Firebase config (env vars not set) → nothing to listen to; stop loading
    // and treat as signed-out so the app renders (login will show a clear error).
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Read the custom claim off the ID token. Force-refresh so a freshly
        // granted `admin` claim is picked up without a re-login.
        const res = await u.getIdTokenResult(true);
        setIsAdmin(res.claims.admin === true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  function ensureAuth() {
    if (!auth) throw new Error("Firebase is not configured (missing NEXT_PUBLIC_FIREBASE_* env vars).");
    return auth;
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(ensureAuth(), email, password);
  }

  async function loginWithGoogle() {
    await signInWithPopup(ensureAuth(), new GoogleAuthProvider());
  }

  async function logout() {
    if (auth) await signOut(auth);
  }

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const current = auth?.currentUser;
      const token = current ? await current.getIdToken() : "";
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, login, loginWithGoogle, logout, authedFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
