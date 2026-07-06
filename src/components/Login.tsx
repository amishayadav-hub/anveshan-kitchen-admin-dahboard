"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That doesn't look like a valid email.",
  "auth/user-not-found": "No account with that email.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/too-many-requests": "Too many attempts — try again later.",
  "auth/popup-closed-by-user": "Sign-in popup closed before finishing.",
};

function message(e: unknown): string {
  const code =
    typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
  return FIREBASE_ERRORS[code] || "Couldn't sign in. Please try again.";
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white text-xl font-bold">
            A
          </div>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Anveshan Admin</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to manage the kitchen.</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-100" />
            <span className="text-xs text-neutral-400 uppercase tracking-wide">or</span>
            <span className="h-px flex-1 bg-neutral-100" />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="w-full py-2.5 rounded-lg border border-neutral-200 font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
