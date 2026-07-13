"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Icon } from "@/components/icons";

interface CampaignRow {
  id: string;
  source: string;
  medium: string;
  campaign: string;
  visits: number;
  conversions: number;
  lastAt: number | null;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

export default function CampaignsPage() {
  const { authedFetch } = useAuth();
  const [rows, setRows] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/campaigns");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load campaigns");
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const totalVisits = rows?.reduce((s, r) => s + r.visits, 0) ?? 0;
  const totalConv = rows?.reduce((s, r) => s + r.conversions, 0) ?? 0;
  const rate = totalVisits ? Math.round((totalConv / totalVisits) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Icon name="campaign" className="h-6 w-6 text-emerald-700" /> Campaigns
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            First-party UTM attribution — which campaigns bring visitors and checkouts.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {loading && !rows && <p className="text-sm text-neutral-500">Loading…</p>}

      {rows && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Tile label="Campaign visits" value={totalVisits.toLocaleString()} />
            <Tile label="Checkouts (conv.)" value={totalConv.toLocaleString()} />
            <Tile label="Conversion rate" value={`${rate}%`} />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
              No campaign traffic yet. Share a link with <code className="font-mono">?utm_source=…&amp;utm_campaign=…</code> and it&apos;ll show here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Source / Medium</th>
                    <th className="px-4 py-3 text-right">Visits</th>
                    <th className="px-4 py-3 text-right">Checkouts</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((r) => {
                    const rRate = r.visits ? Math.round((r.conversions / r.visits) * 100) : 0;
                    return (
                      <tr key={r.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-900">{r.campaign}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {r.source} <span className="text-neutral-400">/ {r.medium}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.visits.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{r.conversions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{rRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
