"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Field, ImageUrlField, Modal, Select, TextArea, TextInput } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { AnveshanProduct, GheeVariantOption, GheeVariant } from "@/types";

const CATEGORIES = ["ghee", "sweetener", "oil", "grain", "spice", "superfood"] as const;
const GHEE_TYPES: GheeVariant[] = ["gir-cow", "desi-cow", "buffalo"];

const CAT_COLORS: Record<string, string> = {
  ghee: "bg-amber-100 text-amber-800",
  sweetener: "bg-rose-100 text-rose-800",
  oil: "bg-yellow-100 text-yellow-800",
  grain: "bg-lime-100 text-lime-800",
  spice: "bg-orange-100 text-orange-800",
  superfood: "bg-emerald-100 text-emerald-800",
};

type Draft = Partial<AnveshanProduct> & { id: string };

const EMPTY: Draft = {
  id: "",
  name: "",
  price: 0,
  image: "",
  category: "ghee",
  shopifyVariantId: "",
  whyAnveshan: "",
  variants: [],
};

// ── variants (sizes / packs) editor ──────────────────────────────────────────
function VariantsEditor({
  items,
  onChange,
}: {
  items: GheeVariantOption[];
  onChange: (next: GheeVariantOption[]) => void;
}) {
  function update(i: number, patch: Partial<GheeVariantOption>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-2 space-y-2">
          <div className="grid grid-cols-[1fr_1fr_90px_auto] gap-2 items-center">
            <Select value={v.type} onChange={(e) => update(i, { type: e.target.value as GheeVariant })}>
              {GHEE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <TextInput placeholder="Label (e.g. 500ml Jar)" value={v.label} onChange={(e) => update(i, { label: e.target.value })} />
            <TextInput type="number" placeholder="₹" value={v.price} onChange={(e) => update(i, { price: Number(e.target.value) })} />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 px-2" aria-label="Remove variant">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
          <TextInput placeholder="Shopify variant id" value={v.shopifyVariantId} onChange={(e) => update(i, { shopifyVariantId: e.target.value })} />
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => onChange([...items, { type: "gir-cow", label: "", shopifyVariantId: "", price: 0 }])}
      >
        + Add variant
      </Button>
    </div>
  );
}

export default function ProductsPage() {
  const { authedFetch } = useAuth();
  const [products, setProducts] = useState<AnveshanProduct[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load products");
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setDraft({ ...EMPTY });
    setIsNew(true);
    setFormError("");
  }
  function openEdit(p: AnveshanProduct) {
    setDraft({ ...p, variants: p.variants ?? [] });
    setIsNew(false);
    setFormError("");
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError("");
    try {
      // Drop an empty variants array so non-ghee products stay clean.
      const payload = { ...draft };
      if (!payload.variants || payload.variants.length === 0) delete payload.variants;
      const res = isNew
        ? await authedFetch("/api/products", { method: "POST", body: JSON.stringify(payload) })
        : await authedFetch(`/api/products/${encodeURIComponent(draft.id)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDraft(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(p: AnveshanProduct) {
    if (!confirm(`Delete product "${p.name}"? This cannot be undone.`)) return;
    const res = await authedFetch(`/api/products/${encodeURIComponent(p.id)}`, { method: "DELETE" });
    if (res.ok) await load();
    else setError((await res.json()).error || "Delete failed");
  }

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (products ?? []).forEach((p) => (m[p.category] = (m[p.category] ?? 0) + 1));
    return m;
  }, [products]);

  const visible = (products ?? []).filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  return (
    <div>
      <header className="flex items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Icon name="products" className="h-6 w-6 text-emerald-700" /> Products
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {products ? `${products.length} products · the hero of every recipe` : "…"}
          </p>
        </div>
        <Button onClick={openNew}>+ New product</Button>
      </header>

      {error && (
        <div className="my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Search + category filter */}
      <div className="mt-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative sm:max-w-xs w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <TextInput placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                cat === c ? "bg-emerald-700 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {c}
              {c !== "all" && counts[c] ? <span className="ml-1 opacity-70">{counts[c]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      {products && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-neutral-200 bg-white overflow-hidden flex flex-col hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className="relative h-40 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-neutral-300 text-sm">no image</span>
                )}
                <span className={`absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${CAT_COLORS[p.category] ?? "bg-neutral-100 text-neutral-600"}`}>
                  {p.category}
                </span>
                {p.variants && p.variants.length > 0 && (
                  <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white">
                    {p.variants.length} sizes
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-900 leading-tight">{p.name}</h3>
                  <span className="text-sm font-bold text-emerald-700 shrink-0">₹{p.price}</span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-400 font-mono">{p.id}</p>
                {p.whyAnveshan && <p className="mt-2 text-xs text-neutral-500 line-clamp-2">{p.whyAnveshan}</p>}
                <div className="mt-3 pt-3 border-t border-neutral-100 flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(p)} className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => del(p)} className="text-red-500 hover:text-red-700">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-neutral-500 col-span-full py-8 text-center">No products match.</p>
          )}
        </div>
      )}

      {draft && (
        <Modal
          title={isNew ? "New product" : `Edit ${draft.name}`}
          onClose={() => setDraft(null)}
          footer={
            <>
              {formError && <span className="text-sm text-red-600 mr-auto self-center">{formError}</span>}
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <Field label="Product ID" hint={isNew ? "Lowercase slug, e.g. khapli-atta. Can't change later." : "Fixed."}>
            <TextInput value={draft.id} disabled={!isNew} onChange={(e) => set("id", e.target.value.trim())} placeholder="khapli-atta" />
          </Field>
          <Field label="Name">
            <TextInput value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)">
              <TextInput type="number" value={draft.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} />
            </Field>
            <Field label="Category">
              <Select value={draft.category} onChange={(e) => set("category", e.target.value as AnveshanProduct["category"])}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <ImageUrlField value={draft.image ?? ""} onChange={(v) => set("image", v)} />
          <Field label="Shopify Variant ID" hint="Default variant used to build cart links.">
            <TextInput value={draft.shopifyVariantId ?? ""} onChange={(e) => set("shopifyVariantId", e.target.value)} />
          </Field>
          <Field label="Why Anveshan" hint="Short benefit line shown on the site.">
            <TextArea rows={2} value={draft.whyAnveshan ?? ""} onChange={(e) => set("whyAnveshan", e.target.value)} />
          </Field>

          <Field label="Variants (sizes / packs)" hint="Optional — e.g. ghee comes in Gir Cow / Desi Cow / Buffalo. Each variant has its own Shopify id + price.">
            <VariantsEditor items={draft.variants ?? []} onChange={(v) => set("variants", v)} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
