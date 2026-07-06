"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Login from "./Login";
import { NAV } from "@/lib/nav";
import { Icon } from "./icons";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <span className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
    </div>
  );
}

function NotAuthorized() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-bold text-neutral-900">Not authorized</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {user?.email} is signed in but isn&apos;t an admin. Ask an existing admin to grant
          access (custom claim or ADMIN_EMAILS), then sign in again.
        </p>
        <button
          onClick={logout}
          className="mt-6 px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <Spinner />;
  if (!user) return <Login />;
  if (!isAdmin) return <NotAuthorized />;

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const navLinks = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(item.href)
              ? "bg-emerald-700 text-white"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2 px-2 py-2 mb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold">
            A
          </span>
          <span className="font-bold text-neutral-900">Anveshan Admin</span>
        </div>
        {navLinks}
        <div className="mt-auto pt-4 border-t border-neutral-100">
          <p className="px-3 text-xs text-neutral-400 truncate">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white text-sm font-bold">
            A
          </span>
          <span className="font-semibold text-neutral-900 text-sm">Anveshan Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          className="p-2 text-neutral-600"
        >
          <Icon name={mobileOpen ? "close" : "menu"} className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-30 bg-white p-4 overflow-y-auto">
          {navLinks}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="px-3 text-xs text-neutral-400 truncate">{user.email}</p>
            <button
              onClick={logout}
              className="mt-2 w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 md:pl-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">{children}</div>
      </main>
    </div>
  );
}
