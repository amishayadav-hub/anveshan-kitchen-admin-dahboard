"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/components/AuthProvider";
import { Icon } from "@/components/icons";

export default function Overview() {
  const { user } = useAuth();
  const [health, setHealth] = useState<{ adminConfigured: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const sections = NAV.filter((n) => n.href !== "/");

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Control the Anveshan Kitchen site from one place.
        </p>
      </header>

      {health && !health.adminConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Service account not configured.</strong> Set{" "}
          <code className="font-mono">FIREBASE_SERVICE_ACCOUNT</code> in{" "}
          <code className="font-mono">.env.local</code> to enable managing content. Reads and
          writes will fail until then.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <Icon name={s.icon} className="h-7 w-7 text-emerald-700" />
            <h2 className="mt-3 font-semibold text-neutral-900 group-hover:text-emerald-700">
              {s.label}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{s.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
