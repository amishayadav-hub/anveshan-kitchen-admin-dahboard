"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Field, TextInput } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

interface GeneratorSettings {
  enabled: boolean;
  rateLimitPerMin: number;
  groundingThreshold: number;
}

function SettingsTab() {
  const { authedFetch } = useAuth();
  const [s, setS] = useState<GeneratorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/settings/generator");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setS(data.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!s) return;
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await authedFetch("/api/settings/generator", {
        method: "PUT",
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setS(data.settings);
      setMsg("Saved. Changes take effect within ~30s on the live site.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!s) return null;

  return (
    <div className="max-w-md space-y-5">
      <label className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <span>
          <span className="block font-medium text-neutral-900">Generator enabled</span>
          <span className="block text-xs text-neutral-500">Turn the AI recipe generator on or off site-wide.</span>
        </span>
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => setS({ ...s, enabled: e.target.checked })}
          className="h-5 w-5 accent-emerald-600"
        />
      </label>

      <Field label="Rate limit (requests / minute / IP)" hint="Abuse guard. Default 15.">
        <TextInput
          type="number"
          value={s.rateLimitPerMin}
          onChange={(e) => setS({ ...s, rateLimitPerMin: Number(e.target.value) })}
        />
      </Field>

      <Field label="Grounding threshold (0–1)" hint="How close a dataset match must be to ground generation. Default 0.5.">
        <TextInput
          type="number"
          step="0.05"
          min="0"
          max="1"
          value={s.groundingThreshold}
          onChange={(e) => setS({ ...s, groundingThreshold: Number(e.target.value) })}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}

interface Funnel {
  totals: { generates: number; variationClicks: number; uniqueUsers: number; conversionRate: number };
  topKeywords: { key: string; count: number }[];
  topVariations: { key: string; count: number }[];
  topProducts: { key: string; count: number }[];
  journeys: {
    id: string;
    uid: string;
    ts: number | null;
    query: string;
    ingredients: string[];
    language: string;
    variationsReturned: string[];
    clicks: { variationName?: string; action?: string; products: string[]; subtotal: number }[];
  }[];
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

function RankList({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: IconName;
  rows: { key: string; count: number }[];
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700 mb-3">
        <Icon name={icon} className="h-4 w-4 text-emerald-700" /> {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex justify-between text-sm mb-0.5">
                <span className="text-neutral-700 truncate">{r.key}</span>
                <span className="font-semibold text-neutral-900 tabular-nums">{r.count}</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelTab() {
  const { authedFetch } = useAuth();
  const [f, setF] = useState<Funnel | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/generator/funnel");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load funnel");
      setF(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!f) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Generations" value={f.totals.generates.toLocaleString()} />
        <Tile label="Variation clicks" value={f.totals.variationClicks.toLocaleString()} />
        <Tile label="Unique visitors" value={f.totals.uniqueUsers.toLocaleString()} />
        <Tile label="Keyword → click" value={`${f.totals.conversionRate}%`} sub="generations with a click" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankList title="Top keywords searched" icon="key" rows={f.topKeywords} />
        <RankList title="Most-clicked variations" icon="dish" rows={f.topVariations} />
        <RankList title="Products added from generator" icon="cart" rows={f.topProducts} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">Recent journeys</h3>
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {f.journeys.length === 0 && <p className="p-4 text-sm text-neutral-400">No generator activity yet.</p>}
          {f.journeys.map((j) => (
            <div key={j.id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-neutral-900">
                  “{j.query}”{" "}
                  <span className="text-xs font-normal text-neutral-400">
                    {j.language} · {j.ingredients.length ? `${j.ingredients.length} ingredients` : "no ingredients"}
                  </span>
                </span>
                <span className="text-xs text-neutral-400 shrink-0">
                  {j.uid.slice(0, 8)}… {j.ts ? `· ${new Date(j.ts).toLocaleString()}` : ""}
                </span>
              </div>
              {j.clicks.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {j.clicks.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5"
                      title={c.products.join(", ")}
                    >
                      <Icon name={c.action === "expand" ? "eye" : "cart"} className="h-3 w-3" />
                      {c.variationName}
                      {c.subtotal ? ` · ₹${c.subtotal}` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-neutral-400">No variation clicked.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  const [tab, setTab] = useState<"settings" | "funnel">("settings");
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Icon name="generator" className="h-6 w-6 text-emerald-700" /> Generator
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Control the AI recipe generator and see how people use it.</p>
      </header>

      <div className="flex gap-2 mb-6">
        {(["settings", "funnel"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-emerald-700 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "settings" ? <SettingsTab /> : <FunnelTab />}
    </div>
  );
}
