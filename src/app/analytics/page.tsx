"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Icon } from "@/components/icons";

interface ClickRow {
  id: string;
  event: string;
  surface: string | null;
  label: string;
  count: number;
  mobile: number;
  desktop: number;
  lastAt: number | null;
}

// Events that signal product-sales intent — foregrounded per Anveshan's goal.
const CONVERSION = ["add_to_cart", "begin_checkout", "footer_link", "app_store_click", "buy_recipe"];
function isConversion(event: string) {
  return CONVERSION.some((c) => event.startsWith(c));
}

function Bar({ row, max }: { row: ClickRow; max: number }) {
  const pct = max > 0 ? (row.count / max) * 100 : 0;
  const mobilePct = row.count > 0 ? (row.mobile / row.count) * 100 : 0;
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-sm text-neutral-700 truncate">{row.label}</span>
        <span className="text-sm font-semibold text-neutral-900 tabular-nums shrink-0">
          {row.count.toLocaleString()}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full rounded-full flex" style={{ width: `${pct}%` }}>
          {/* mobile segment (amber) + desktop segment (emerald) */}
          <div className="h-full bg-amber-400" style={{ width: `${mobilePct}%` }} title={`${row.mobile} mobile`} />
          <div className="h-full bg-emerald-600 flex-1" title={`${row.desktop} desktop`} />
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { authedFetch } = useAuth();
  const [rows, setRows] = useState<ClickRow[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/analytics");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows?.reduce((s, r) => s + r.count, 0) ?? 0;
  const mobile = rows?.reduce((s, r) => s + r.mobile, 0) ?? 0;
  const desktop = rows?.reduce((s, r) => s + r.desktop, 0) ?? 0;
  const max = rows?.reduce((m, r) => Math.max(m, r.count), 0) ?? 0;
  const conversion = (rows ?? []).filter((r) => isConversion(r.event));
  const others = (rows ?? []).filter((r) => !isConversion(r.event));

  return (
    <div>
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Click Analytics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            First-party button & link clicks.{" "}
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" /> desktop
            </span>{" "}
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> mobile
            </span>
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && rows && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Tile label="Total clicks" value={total.toLocaleString()} />
            <Tile label="Desktop" value={desktop.toLocaleString()} sub={total ? `${Math.round((desktop / total) * 100)}%` : "—"} />
            <Tile label="Mobile" value={mobile.toLocaleString()} sub={total ? `${Math.round((mobile / total) * 100)}%` : "—"} />
            <Tile label="Tracked elements" value={rows.length.toLocaleString()} />
          </div>

          {rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
              No clicks recorded yet. Interact with the public site to populate this.
            </div>
          )}

          {conversion.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-1">
                <Icon name="cart" className="h-4 w-4" /> Conversion signals
              </h2>
              <p className="text-xs text-neutral-500 mb-2">Clicks that drive product sales.</p>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 divide-y divide-neutral-100">
                {conversion.map((r) => (
                  <Bar key={r.id} row={r} max={max} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                All other interactions
              </h2>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 divide-y divide-neutral-100">
                {others.map((r) => (
                  <Bar key={r.id} row={r} max={max} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
