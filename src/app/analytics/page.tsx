"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
const isConversion = (event: string) => CONVERSION.some((c) => event.startsWith(c));

// ── humanized labels ─────────────────────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  add_to_cart: "Add to Cart",
  begin_checkout: "Begin Checkout",
  open_cart: "Open Cart",
  footer_link: "Footer Link",
  social_click: "Social",
  app_store_click: "App Store",
  logo_click: "Logo",
  search: "Search",
  select_recipe: "Select Recipe",
  select_variant: "Select Variant",
  like_recipe: "Like Recipe",
  like_post: "Like Post",
  share: "Share",
  filter_category: "Filter Category",
  generate_recipe: "Generate Recipe",
  share_recipe_submit: "Share Recipe (submit)",
  bottom_nav_click: "Bottom Nav",
  menu_open: "Menu Open",
  menu_click: "Menu Click",
  cart_qty_change: "Cart Qty Change",
  cart_remove: "Cart Remove",
  cart_variant_swap: "Cart Variant Swap",
};
const SURFACE_LABELS: Record<string, string> = {
  pdp_panel: "PDP Panel",
  sticky_bar: "Sticky Bar",
  recipe_card: "Recipe Card",
  real_peeps: "Real Peeps",
  generated_recipe: "Generated Recipe",
  header: "Header",
};
const titleCase = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const eventLabel = (event: string) => EVENT_LABELS[event] ?? titleCase(event);
const surfaceLabel = (surface: string | null) =>
  surface ? SURFACE_LABELS[surface] ?? titleCase(surface) : "Unspecified";
function humanize(event: string, surface: string | null): string {
  const base = eventLabel(event);
  return surface ? `${base} — ${surfaceLabel(surface)}` : base;
}

// ── categorization + collapsing helpers ──────────────────────────────────────
type Category = "Navigation" | "Cart" | "Recipe" | "Other";
const CATEGORY_ORDER: Category[] = ["Navigation", "Cart", "Recipe", "Other"];

function categorize(event: string): Category {
  if (event.startsWith("cart_") || event === "open_cart" || event === "begin_checkout") return "Cart";
  if (["bottom_nav_click", "menu_open", "menu_click", "logo_click", "footer_link", "social_click", "app_store_click"].includes(event))
    return "Navigation";
  if (["select_recipe", "generate_recipe", "select_variant", "like_recipe", "like_post", "filter_category", "search", "share", "share_recipe_submit"].includes(event))
    return "Recipe";
  return "Other";
}

interface EventGroup {
  event: string;
  label: string;
  count: number;
  mobile: number;
  desktop: number;
  children: ClickRow[]; // the individual surfaces under this event
}

// Collapse rows sharing an event (e.g. every bottom_nav_click destination) into a
// single expandable parent with a subtotal.
function groupByEvent(rows: ClickRow[]): EventGroup[] {
  const m = new Map<string, ClickRow[]>();
  for (const r of rows) {
    const arr = m.get(r.event) ?? [];
    arr.push(r);
    m.set(r.event, arr);
  }
  return [...m.entries()].map(([event, rs]) => ({
    event,
    label: eventLabel(event),
    count: rs.reduce((s, r) => s + r.count, 0),
    mobile: rs.reduce((s, r) => s + r.mobile, 0),
    desktop: rs.reduce((s, r) => s + r.desktop, 0),
    children: rs,
  }));
}

function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

// ── shared bar row ───────────────────────────────────────────────────────────
// Bar length = volume vs the busiest element. Segments show device mix:
// amber = mobile, emerald = desktop (matches the legend).
function BarRow({
  label,
  rawKey,
  count,
  mobile,
  desktop,
  max,
  top = false,
  indent = false,
  expandable = false,
  expanded = false,
  onToggle,
}: {
  label: string;
  rawKey?: string | null;
  count: number;
  mobile: number;
  desktop: number;
  max: number;
  top?: boolean;
  indent?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const pct = max > 0 ? Math.max((count / max) * 100, 3) : 0; // min sliver so low counts still read
  const mobilePct = count > 0 ? (mobile / count) * 100 : 0;
  const lowData = count > 0 && count <= 2;
  return (
    <div className={`flex items-center gap-3 py-2.5 ${indent ? "pl-7" : ""} ${top ? "-mx-4 rounded-lg bg-emerald-50/70 px-4" : ""}`}>
      {expandable ? (
        <button onClick={onToggle} aria-label="Toggle destinations" className="shrink-0 text-neutral-400 hover:text-neutral-700">
          <Chevron open={expanded} />
        </button>
      ) : (
        indent && <span className="w-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {top && <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">★ TOP</span>}
          <span className="truncate text-sm font-medium text-neutral-800">{label}</span>
          {lowData && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">low data</span>
          )}
        </div>
        {rawKey && <div className="truncate font-mono text-[11px] text-neutral-400">{rawKey}</div>}
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div className="flex h-full rounded-full" style={{ width: `${pct}%` }}>
            <div className="h-full bg-emerald-600" style={{ width: `${mobilePct}%` }} title={`${mobile} mobile`} />
            <div className="h-full flex-1 bg-amber-400" title={`${desktop} desktop`} />
          </div>
        </div>
      </div>
      <div className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-neutral-900">
        {count.toLocaleString()}
      </div>
    </div>
  );
}

// ── KPI tile ─────────────────────────────────────────────────────────────────
function Tile({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "amber" }) {
  const dot = accent === "emerald" ? "bg-emerald-600" : accent === "amber" ? "bg-amber-400" : "";
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        {accent && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

function DeviceSplit({ desktop, mobile }: { desktop: number; mobile: number }) {
  const total = desktop + mobile;
  const dPct = total ? (desktop / total) * 100 : 0;
  const mPct = total ? (mobile / total) * 100 : 0;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Device split</span>
        <span className="flex gap-3 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Desktop {Math.round(dPct)}%</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Mobile {Math.round(mPct)}%</span>
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full bg-amber-400" style={{ width: `${dPct}%` }} />
        <div className="h-full bg-emerald-600" style={{ width: `${mPct}%` }} />
      </div>
      {total === 0 && <p className="mt-2 text-xs text-neutral-400">No device data yet.</p>}
    </div>
  );
}

// ── Conversion Signals (accent card + mini-KPIs + ranked, top emphasized) ─────
function ConversionSection({ rows, max, totalClicks }: { rows: ClickRow[]; max: number; totalClicks: number }) {
  const ranked = [...rows].sort((a, b) => b.count - a.count);
  const addToCartTotal = rows.filter((r) => r.event === "add_to_cart").reduce((s, r) => s + r.count, 0);

  // Denominator available = total tracked clicks → show add-to-cart share of clicks.
  const sharePct = totalClicks ? (addToCartTotal / totalClicks) * 100 : 0;
  // TODO: a *true* conversion rate needs a sessions / unique-visitor denominator
  //       (a sessions counter, generatorEvents uniqueUsers, or GA sessions) — the
  //       `clicks` collection doesn't carry sessions yet, so this is share-of-clicks.

  return (
    <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-emerald-800">
        <Icon name="cart" className="h-4 w-4" /> Conversion signals
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Add-to-cart clicks</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{addToCartTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Conversion rate</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">{totalClicks ? `${sharePct.toFixed(1)}%` : "—"}</p>
          <p className="text-[11px] text-neutral-400">of all clicks · true rate needs sessions (TODO)</p>
        </div>
      </div>

      <div className="divide-y divide-neutral-100 rounded-xl border border-emerald-100 bg-white px-4">
        {ranked.map((r, i) => (
          <BarRow key={r.id} label={humanize(r.event, r.surface)} rawKey={r.id} count={r.count} mobile={r.mobile} desktop={r.desktop} max={max} top={i === 0} />
        ))}
        {ranked.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">No conversion clicks yet.</p>}
      </div>
    </section>
  );
}

// ── All Other Interactions (grouped, collapsible, sortable, filterable) ───────
type SortMode = "count-desc" | "count-asc" | "name";

function OtherSection({ rows, max }: { rows: ClickRow[]; max: number }) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("count-desc");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const sortGroups = useCallback(
    (a: EventGroup, b: EventGroup) => {
      if (sortMode === "count-asc") return a.count - b.count;
      if (sortMode === "name") return a.label.localeCompare(b.label);
      return b.count - a.count;
    },
    [sortMode]
  );

  const byCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter(
      (r) => !q || humanize(r.event, r.surface).toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );
    const cats: Record<Category, EventGroup[]> = { Navigation: [], Cart: [], Recipe: [], Other: [] };
    for (const cat of CATEGORY_ORDER) {
      const catRows = filtered.filter((r) => categorize(r.event) === cat);
      cats[cat] = groupByEvent(catRows).sort(sortGroups);
    }
    return { cats, count: filtered.length };
  }, [rows, query, sortGroups]);

  const inputCls =
    "px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">All other interactions</h2>
        <div className="flex gap-2">
          <input className={`${inputCls} w-40`} placeholder="Filter…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className={inputCls} value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="count-desc">Most clicks</option>
            <option value="count-asc">Fewest clicks</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white px-4">
        {CATEGORY_ORDER.map((cat) => {
          const groups = byCategory.cats[cat];
          if (groups.length === 0) return null;
          const subtotal = groups.reduce((s, g) => s + g.count, 0);
          return (
            <div key={cat} className="border-b border-neutral-100 py-2 last:border-b-0">
              <div className="flex items-center justify-between py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <span>{cat}</span>
                <span className="tabular-nums">{subtotal.toLocaleString()}</span>
              </div>
              <div className="divide-y divide-neutral-100">
                {groups.map((g) => {
                  const multi = g.children.length > 1;
                  const isOpen = !!open[g.event];
                  if (!multi) {
                    const c = g.children[0];
                    return (
                      <BarRow key={g.event} label={humanize(c.event, c.surface)} rawKey={c.id} count={c.count} mobile={c.mobile} desktop={c.desktop} max={max} />
                    );
                  }
                  return (
                    <div key={g.event}>
                      <BarRow
                        label={`${g.label} (${g.children.length})`}
                        count={g.count}
                        mobile={g.mobile}
                        desktop={g.desktop}
                        max={max}
                        expandable
                        expanded={isOpen}
                        onToggle={() => setOpen((o) => ({ ...o, [g.event]: !o[g.event] }))}
                      />
                      {isOpen &&
                        [...g.children]
                          .sort((a, b) => b.count - a.count)
                          .map((c) => (
                            <BarRow key={c.id} label={surfaceLabel(c.surface)} rawKey={c.id} count={c.count} mobile={c.mobile} desktop={c.desktop} max={max} indent />
                          ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {byCategory.count === 0 && <p className="py-6 text-center text-sm text-neutral-400">No interactions match.</p>}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { authedFetch } = useAuth();
  const [rows, setRows] = useState<ClickRow[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/analytics");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setRows(data.rows);
      setLastUpdated(Date.now());
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
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Icon name="analytics" className="h-6 w-6 text-emerald-700" /> Click Analytics
          </h1>
          <p className="mt-1 text-sm text-neutral-500">First-party button &amp; link clicks — desktop vs mobile.</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
          >
            {loading ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="eye" className="h-4 w-4" />}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {lastUpdated && !loading && (
            <span className="text-[11px] text-neutral-400">Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!error && rows && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Total clicks" value={total.toLocaleString()} />
            <Tile label="Desktop" value={desktop.toLocaleString()} accent="amber" />
            <Tile label="Mobile" value={mobile.toLocaleString()} accent="emerald" />
            <Tile label="Tracked elements" value={rows.length.toLocaleString()} />
          </div>

          <div className="mb-8">
            <DeviceSplit desktop={desktop} mobile={mobile} />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
              No clicks recorded yet. Interact with the public site to populate this.
            </div>
          ) : (
            <div className="space-y-8">
              <ConversionSection rows={conversion} max={max} totalClicks={total} />
              <OtherSection rows={others} max={max} />
            </div>
          )}
        </>
      )}

      {loading && !rows && <p className="text-sm text-neutral-500">Loading…</p>}
    </div>
  );
}
